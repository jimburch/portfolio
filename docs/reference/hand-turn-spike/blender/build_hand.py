# Builds hand-v10.glb from the WebXR generic-hand right.glb (MIT, (c) 2019 Amazon).
#
#   /Applications/Blender.app/Contents/MacOS/Blender -b --python build_hand.py -- <in right.glb> <out hand-v10.glb>
#
# v9 -> v10 (the wrist only; fingers, thumb, sleeve, colours and export unchanged):
#  - v9's waist (WAIST_*) and heel slimming (HYPO, now default 0) are gone. In their place a measured TAPER: each side's
#    half-width (ulnar, radial) and the dorso-palmar extent are measured along the forearm axis, and between TAPER_A (in
#    the heel, behind the card) and TAPER_B (at the cuff) they are re-shaped to a monotone cubic from the heel's own
#    width and slope down to U_B / R_B, so the heel flows into a solid wrist with no corner (the bind mesh had one at
#    the wrist joint) and no pinch. The forearm past TAPER_B keeps that ratio.
#  - the bend weights spread wider (D0 / D1 -.016 / .044, v9 -.008 / .034), so the wrist bends as an arc.
#  - forearm ring widening FORE_K .06 (v9 .08: the forearm no longer has to widen back out of a waist).
#  - an optional Laplacian relax of the wrist band (SMOOTH_IT, default off: it left shade slivers on the contour).
#
# v7 -> v9 (proportions only; joints, weights, sleeve, colours and export unchanged):
#  - thumb: proximal / distal target widths 23.0 / 22.0 -> THUMB_P / THUMB_D (20.0 / 18.6) (about the index's width, +5-12%),
#    so the thumb tip is no fatter than a fingertip plus a little (measured 19.8 / 20.6 mm vs index 20.3 / 17.7)
#  - thenar: the thumb-metacarpal region is pulled toward its bone by THENAR_S (weight-blended), so the mound
#    flows into the palm instead of standing off it as a block
#  - wrist: a waist. Every non-thumb skin vertex near the wrist joint is scaled about the forearm axis by
#    sx(d) / sy(d) (a smooth dip centred just past the joint), and the forearm rings re-taper, so the heel
#    narrows into the wrist and the forearm widens again toward the cuff
#
# (The `blender` symlink on PATH fails to find its bundled Python under this sandbox; the app binary works.)
#
# v6 -> v7:
#  - the skin forearm is short (it only has to reach inside the sleeve): rings to 10 cm, not 16
#  - finger volume: after Catmull-Clark, every finger/thumb vertex is pushed out radially from its bone's
#    segment (weight-blended), by a per-segment factor that brings each segment to a target width
#    (real proportions: proximal ~20-24% of palm width, gentle taper, round pad at the tip, thumb thicker)
#  - a SLEEVE mesh (the wearer's jacket) skinned 100% to the forearm bone: a tapered elliptical tube with a
#    rolled cuff lip, an inner wall (the dark inside of the sleeve), and a stitched cuff seam
#  - vertex colours (COLOR_0) that multiply the page's toon ramp: warm/pink fingertips and knuckles on the skin;
#    cuff band, seam, dark inner wall and a slight darkening toward the elbow on the sleeve
#
# Steps:
# 1. Import, weld the UV-seam duplicates (so subdivision doesn't tear), cut off the slanted wrist cap.
# 2. Extrude the wrist opening into a short tapered forearm (open end hidden inside the sleeve).
# 3. Add a `forearm` bone (pivot at the wrist joint, pointing toward the elbow), weights smoothstep(D0, D1, d).
# 4. Triangles -> quads, one level of Catmull-Clark (weights interpolate), finger inflation, smooth normals.
# 5. Build the sleeve.
# 6. Export GLB (positions, normals, skin, COLOR_0; no UVs, no material), two meshes: `hand`, `sleeve`.
# 7. Post-process: rewrite every joint back to its WebXR frame (-Z distal, +Y dorsal, +X little finger), real
#    hierarchy forearm > wrist > metacarpal > ... > tip, recompute the inverse binds (bind pose unchanged),
#    then KHR_mesh_quantization.
import bpy, bmesh, sys, json, struct, math, os
from mathutils import Vector, Quaternion, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from measure import measure, profile, thenar

SRC, OUT = sys.argv[-2], sys.argv[-1]
# ------------------------------------------------------------------ v9 proportion knobs (env overrides for sweeps)
E = lambda k, d: float(os.environ.get(k, d))
THUMB_P, THUMB_D = E('THUMB_P', 20.0), E('THUMB_D', 18.6)      # mm, radial-ulnar at mid-segment (index: 20.3 / 17.7)
THENAR_S = E('THENAR_S', .72)                                   # radial scale of the thumb-metacarpal region about its bone
HYPO, HYPO_D, HYPO_W = E('HYPO', 0), E('HYPO_D', -.018), E('HYPO_W', .013)   # v9's ulnar heel slimming (v10: off; the taper shapes the heel)
# v10 wrist taper: between TAPER_A (in the heel, hidden behind the card) and TAPER_B (at the cuff) each side's half-width
# follows a monotone cubic from the heel's own width and slope down to U_B / R_B, then stays at that ratio up the forearm.
# No waist (v9's dip read as a pinch) and no corner where the heel meets the wrist (the bind mesh had one at d = 0).
TAPER_A, TAPER_B = E('TAPER_A', -.034), E('TAPER_B', .044)
RATIO_S = E('RATIO_S', .008)                                    # Gaussian smoothing of the taper ratio along the axis (m)
U_B, R_B = E('U_B', .027), E('R_B', .0265)                       # half-widths at TAPER_B (m) about the opening's centre: ulnar / radial
SMOOTH_MODE = E('SMOOTH_MODE', 1)
TAPER_Y = E('TAPER_Y', 1)
TY_K = E('TY_K', .5)      # strength of the dorso-palmar taper (full strength left a ridge that broke the toon shade into islands mid-turn)
TY_X0, TY_X1 = E('TY_X0', -1), E('TY_X1', -.9)   # optional fade of the dorso-palmar taper across the axis (default: uniform; an ulnar-only fade rippled the shading)    # also taper the dorso-palmar extent (palmar side scaled by this at TAPER_B; 0 = off)
SMOOTH_IT, SMOOTH_L, SMOOTH_A, SMOOTH_B = E('SMOOTH_IT', 0), E('SMOOTH_L', .5), E('SMOOTH_A', -.03), E('SMOOTH_B', .036)   # optional wrist-band relax (off)
FORE_K = E('FORE_K', .06)                                       # forearm ring widening per m (v7 .052)

# ------------------------------------------------------------------ the WebXR joint frames (glTF space)
def read_glb(path):
    b = open(path, 'rb').read()
    jl = struct.unpack_from('<I', b, 12)[0]
    j = json.loads(b[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack_from('<I', b, off)[0]
    return j, bytearray(b[off + 8: off + 8 + bl])

def write_glb(path, j, binbuf):
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    binbuf = bytes(binbuf) + b'\0' * ((4 - len(binbuf) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(binbuf)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(binbuf), 0x004E4942)); f.write(binbuf)

def node_local(n):
    t = Vector(n.get('translation', [0, 0, 0]))
    r = n.get('rotation', [0, 0, 0, 1]); q = Quaternion((r[3], r[0], r[1], r[2]))
    s = n.get('scale', [1, 1, 1])
    return Matrix.Translation(t) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((s[0], s[1], s[2], 1))

srcj, _ = read_glb(SRC)
XR = {}   # joint name -> world matrix (the source Armature node is identity, joints are its direct children)
for n in srcj['nodes']:
    if 'mesh' not in n and n['name'] != 'Armature':
        XR[n['name']] = node_local(n)
XR['forearm'] = XR['wrist'].copy()     # the forearm's pivot and axes are the wrist joint's

# glTF (y up) -> Blender (z up)
C3 = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))
Wm = XR['wrist']
W = C3 @ Wm.to_translation()
R = C3 @ Wm.to_3x3()
AX = (R @ Vector((0, 0, 1))).normalized()   # proximal: toward the elbow
EX = (R @ Vector((1, 0, 0))).normalized()   # little-finger side
EY = (R @ Vector((0, 1, 0))).normalized()   # back of the hand
JB = {k: C3 @ v.to_translation() for k, v in XR.items()}   # joint positions, Blender space
RB = {k: C3 @ v.to_3x3() for k, v in XR.items()}

# ------------------------------------------------------------------ import
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
me = [o for o in bpy.data.objects if o.type == 'MESH' and o.vertex_groups][0]
for o in list(bpy.data.objects):
    if o not in (arm, me): bpy.data.objects.remove(o)
me.name = 'hand'; me.data.name = 'hand'

bm = bmesh.new(); bm.from_mesh(me.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
dist = lambda co: (co - W).dot(AX)

# cut the wrist cap: faces facing down the forearm axis at the wrist end
cap = [f for f in bm.faces if f.normal.dot(AX) > .8 and min(dist(v.co) for v in f.verts) > .005]
bmesh.ops.delete(bm, geom=cap, context='FACES_ONLY')
for v in [v for v in bm.verts if not v.link_faces]: bm.verts.remove(v)
bnd = [e for e in bm.edges if e.is_boundary]
adj = {}
for e in bnd:
    a, b = e.verts; adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
assert all(len(v) == 2 for v in adj.values()), 'wrist opening is not one simple loop'
loop = [next(iter(adj))]
while True:
    nxt = [n for n in adj[loop[-1]] if n not in loop]
    if not nxt: break
    loop.append(nxt[0])
assert len(loop) == len(adj)
print('[build] wrist opening loop: %d verts, d %.4f..%.4f' % (len(loop), min(dist(v.co) for v in loop), max(dist(v.co) for v in loop)))

# ------------------------------------------------------------------ forearm rings (skin; ends inside the sleeve)
def sstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
cx = sum((v.co - W).dot(EX) for v in loop) / len(loop)
cy = sum((v.co - W).dot(EY) for v in loop) / len(loop)
def rxy(d):   # forearm half-widths (m): wrist ~5.3 x 3.8 cm, widening toward the elbow
    return .0262 + (d - .02) * FORE_K, .0188 + (d - .02) * .046
RINGS = [(.008, 0.0, True), (.036, .55, False), (.056, 1, False), (.078, 1, False), (.100, 1, False)]
prev = loop
for (dk, blend, slant) in RINGS:
    ring = []
    for v in loop:
        p = v.co - W
        x, y = p.dot(EX) - cx, p.dot(EY) - cy
        ang = math.atan2(y / .0188, x / .0262)        # elliptic angle of the opening vertex
        d0 = dist(v.co)
        d = d0 + dk if slant else dk
        ex, ey = rxy(d)
        tx, ty = math.cos(ang) * ex, math.sin(ang) * ey
        x2, y2 = x + (tx - x) * blend, y + (ty - y) * blend
        co = W + EX * (x2 + cx) + EY * (y2 + cy) + AX * d
        ring.append(bm.verts.new(co))
    n = len(loop)
    for i in range(n):
        bm.faces.new((prev[i], prev[(i + 1) % n], ring[(i + 1) % n], ring[i]))
    prev = ring
bm.normal_update()
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bmesh.ops.join_triangles(bm, faces=[f for f in bm.faces if len(f.verts) == 3],
                         angle_face_threshold=math.radians(40), angle_shape_threshold=math.radians(40))
bm.to_mesh(me.data); bm.free()
me.data.update()

# ------------------------------------------------------------------ forearm bone + weights
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones.new('forearm')
inv = arm.matrix_world.inverted()
eb.head = inv @ W; eb.tail = inv @ (W + AX * .25)
eb.roll = 0
bpy.ops.object.mode_set(mode='OBJECT')

D0, D1 = E('D0', -.016), E('D1', .044)      # the bend spreads from the heel of the palm to the cuff (v9: -.008 / .034; v10 wider, so it reads as an arc, not a hinge)
vg_fore = me.vertex_groups.new(name='forearm')
for v in me.data.vertices:
    w = sstep(D0, D1, dist(me.matrix_world @ v.co))
    if len(v.groups) == 0:
        if w < .999: me.vertex_groups['wrist'].add([v.index], 1 - w, 'REPLACE')
        vg_fore.add([v.index], w, 'REPLACE'); continue
    if w >= .999:
        for g in list(v.groups): me.vertex_groups[g.group].remove([v.index])
        vg_fore.add([v.index], 1.0, 'REPLACE'); continue
    if w > 0:
        for g in v.groups: g.weight *= (1 - w)
        vg_fore.add([v.index], w, 'REPLACE')

# ------------------------------------------------------------------ subdivide (weights interpolate)
bpy.context.view_layer.objects.active = me
me.select_set(True)
sub = me.modifiers.new('sub', 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
sub.uv_smooth = 'NONE'
bpy.ops.object.modifier_move_to_index(modifier='sub', index=0)
bpy.ops.object.modifier_apply(modifier='sub')
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
before = measure(me, XR, C3, 'after subdiv, before inflation')
profile(me, W, AX, EX, EY, 'before')
thenar(me, JB, 'before')

# ------------------------------------------------------------------ finger volume
# Target widths (radial-ulnar, mm) per segment, for an ~83 mm palm: proximal ~20-24% of the palm, a gentle taper
# to a round pad. Each vertex moves out from the closest point on its bones' segments by
#   sum_b w_b * (s_b - 1) * radial_b,   s_b = target_b / measured_b
# so the cross-section scales about the bone (shape kept, volume restored), the tip cap scales spherically
# (a round pad, not a point), and joints blend because the weights do. The palmar side of the distal pad
# gets a little extra (the pulp).
TARGET = {
    'index-finger-phalanx-proximal': 21.0, 'index-finger-phalanx-intermediate': 18.0, 'index-finger-phalanx-distal': 16.5,
    'middle-finger-phalanx-proximal': 21.0, 'middle-finger-phalanx-intermediate': 18.5, 'middle-finger-phalanx-distal': 17.0,
    'ring-finger-phalanx-proximal': 19.8, 'ring-finger-phalanx-intermediate': 17.4, 'ring-finger-phalanx-distal': 16.0,
    'pinky-finger-phalanx-proximal': 17.8, 'pinky-finger-phalanx-intermediate': 15.6, 'pinky-finger-phalanx-distal': 14.4,
    'thumb-phalanx-proximal': THUMB_P, 'thumb-phalanx-distal': THUMB_D,
}
PULP = 1.10
SEGS = {}
for f in ['index', 'middle', 'ring', 'pinky']:
    c = [f + '-finger-' + b for b in ['phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip']]
    for a, b in zip(c, c[1:]): SEGS[a] = (JB[a], JB[b], a)
    SEGS[c[3]] = (JB[c[2]], JB[c[3]], c[2])          # the tip bone's verts use the distal segment
c = ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip']
SEGS[c[1]] = (JB[c[1]], JB[c[2]], c[1]); SEGS[c[2]] = (JB[c[2]], JB[c[3]], c[2]); SEGS[c[3]] = (JB[c[2]], JB[c[3]], c[2])
SCALE = {k: TARGET[k] / before[k][0] for k in TARGET}
vgn = {g.index: g.name for g in me.vertex_groups}
MW = me.matrix_world; MWi = MW.inverted()
moves = []
for v in me.data.vertices:
    p = MW @ v.co
    dsp = Vector()
    for g in v.groups:
        nm = vgn[g.group]
        if nm == 'thumb-metacarpal':
            h, t = JB['thumb-metacarpal'], JB['thumb-phalanx-proximal']
            ax = t - h; u = max(0.0, min(1.0, (p - h).dot(ax) / ax.length_squared))
            dsp += (p - (h + ax * u)) * ((THENAR_S - 1) * g.weight)
            continue
        if nm not in SEGS: continue
        h, t, key = SEGS[nm]
        ax = t - h; L2 = ax.length_squared
        u = max(0.0, min(1.0, (p - h).dot(ax) / L2))
        rad = p - (h + ax * u)
        s = SCALE[key] - 1
        if key.endswith('distal') and rad.dot(RB[key] @ Vector((0, 1, 0))) < 0: s = (1 + s) * PULP - 1
        dsp += rad * (s * g.weight)
    moves.append(dsp)
for v, dsp in zip(me.data.vertices, moves):
    v.co = MWi @ (MW @ v.co + dsp)
me.data.update()
# v10 wrist taper (replaces v9's waist): measure each side's half-width profile (non-thumb verts, 4 mm bins, smoothed),
# build the target curve, scale every vertex's offset from the axis on that side by target / measured at its d
# (weight-blended off the thumb, so the thenar keeps its shape; v9's heel slimming stays available as HYPO).
def thumbw(v): return sum(g.weight for g in v.groups if vgn[g.group].startswith('thumb'))
PTS = []
for v in me.data.vertices:
    p = MW @ v.co - W
    PTS.append((v.index, p.dot(AX), p.dot(EX) - cx, thumbw(v), p.dot(EY) - cy))
if HYPO:
    for i, (vi, d, x, tw, y) in enumerate(PTS):
        v = me.data.vertices[vi]
        if x > 0:
            x2 = x * (1 - HYPO * math.exp(-((d - HYPO_D) / HYPO_W) ** 2) * (1 - tw))
            v.co = MWi @ (MW @ v.co + EX * (x2 - x)); PTS[i] = (vi, d, x2, tw, y)
def apply_taper(label):
    VS = me.data.vertices
    PTS[:] = [(vi, (MW @ VS[vi].co - W).dot(AX), (MW @ VS[vi].co - W).dot(EX) - cx, tw, (MW @ VS[vi].co - W).dot(EY) - cy) for vi, d, x, tw, y in PTS]
    BIN = .004
    def side_profile(sgn, axis):
        raw = {}
        for vi, d, x, tw, y in PTS:
            if tw > .3 or d < TAPER_A - .02 or d > TAPER_B + .02: continue
            k = round(d / BIN); raw[k] = max(raw.get(k, -1), sgn * (x if axis == 'x' else y))
        ks = sorted(raw)
        if os.environ.get('TDEBUG'): print('[taper raw %d]' % sgn, ' '.join('%d:%.1f' % (k * BIN * 1e3, raw[k] * 1e3) for k in ks))
        # drop sparse-bin dips (a bin that only caught a few inner verts where the generated rings meet the hand mesh)
        nb = lambda k: [raw[j] for j in ks if 0 < abs(j - k) <= 2]
        ks = [k for k in ks if raw[k] >= .93 * max(nb(k) or [0])]
        sm = {k: sum(raw[j] for j in ks if abs(j - k) <= 1) / sum(1 for j in ks if abs(j - k) <= 1) for k in ks}
        xs = [k * BIN for k in ks]; ys = [sm[k] for k in ks]
        def h(d):
            if d <= xs[0]: return ys[0]
            for i in range(1, len(xs)):
                if d <= xs[i]: u = (d - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[i - 1] + (ys[i] - ys[i - 1]) * u
            return ys[-1]
        return h
    def hermite_target(h, hb):
        ha = h(TAPER_A); m0 = (h(TAPER_A + .003) - h(TAPER_A - .003)) / .006
        L = TAPER_B - TAPER_A; delta = (hb - ha) / L
        m1 = 0.0
        if delta == 0 or m0 * delta <= 0: m0 = 0.0
        elif m0 / delta > 3: m0 = 3 * delta          # Fritsch-Carlson: no overshoot, so no waist
        def tgt(d):
            u = (d - TAPER_A) / L; u2, u3 = u * u, u * u * u
            return (2*u3 - 3*u2 + 1) * ha + (u3 - 2*u2 + u) * L * m0 + (-2*u3 + 3*u2) * hb + (u3 - u2) * L * m1
        return tgt, ha, m0
    SIDES = {}
    for sgn, ax, hb, nm in ((1, 'x', U_B, 'ulnar'), (-1, 'x', R_B, 'radial'), (1, 'y', None, 'dorsal'), (-1, 'y', None, 'palmar')):
        if ax == 'y' and not TAPER_Y: continue
        h = side_profile(sgn, ax)
        if hb is None: hb = h(TAPER_B) * (TAPER_Y if sgn < 0 else 1)    # dorso-palmar: keep the forearm's thickness, smooth the heel into it
        tgt, ha, m0 = hermite_target(h, hb)
        SIDES[(sgn, ax)] = (h, tgt)
        print('[taper %s %s] heel %.1f mm (slope %.2f) -> %.1f mm; measured/target:' % (label, nm, ha * 1e3, m0, hb * 1e3),
              ' '.join('%+d:%.1f/%.1f' % (dd, h(dd / 1e3) * 1e3, tgt(dd / 1e3) * 1e3) for dd in range(-40, 61, 10) if TAPER_A * 1e3 <= dd <= TAPER_B * 1e3))
    def raw_ratio(sgn, ax, d):
        h, tgt = SIDES[(sgn, ax)]
        if d <= TAPER_A: return 1.0
        dd = min(d, TAPER_B)
        return tgt(dd) / h(dd)
    # the ratio is Gaussian-smoothed along the axis (RATIO_S): the measured profile is binned over sparse, slanted edge
    # loops, so target / measured carries their noise, which showed as a wobble in the contour seen side-on mid-turn
    GRID = [TAPER_A - .03 + i * .001 for i in range(int((TAPER_B - TAPER_A + .06) / .001) + 1)]
    SM = {}
    for key in SIDES:
        rr = [raw_ratio(key[0], key[1], g) for g in GRID]
        out = []
        for g in GRID:
            ws = [math.exp(-((g2 - g) / RATIO_S) ** 2 / 2) if RATIO_S > 0 else float(g2 == g) for g2 in GRID]
            out.append(sum(w * r for w, r in zip(ws, rr)) / sum(ws))
        SM[key] = out
    def ratio(sgn, ax, d):
        if (sgn, ax) not in SIDES or d <= GRID[0]: return 1.0
        rr = SM[(sgn, ax)]
        if d >= GRID[-1]: return rr[-1]
        i = int((d - GRID[0]) / .001); u = (d - GRID[i]) / .001
        return rr[i] + (rr[min(i + 1, len(rr) - 1)] - rr[i]) * u
    for vi, d, x, tw, y in PTS:
        v = VS[vi]
        if d <= TAPER_A: continue
        kx = 1 + (ratio(1 if x > 0 else -1, 'x', d) - 1) * (1 - tw)
        ky = 1 + (ratio(1 if y > 0 else -1, 'y', d) - 1) * (1 - tw) * TY_K * sstep(TY_X0, TY_X1, x)
        v.co = MWi @ (MW @ v.co + EX * (x * kx - x) + EY * (y * ky - y))

apply_taper('1')
# relax the wrist band (Laplacian, volume-preserving) so the heel's original triangle-fan topology doesn't leave a
# wobble in the silhouette where it meets the forearm rings; then taper again so the widths stay on target
if SMOOTH_IT:
    me.data.update()
    bm = bmesh.new(); bm.from_mesh(me.data); bm.verts.ensure_lookup_table()
    band = [bm.verts[vi] for vi, d, x, tw, y in PTS if SMOOTH_A < d < SMOOTH_B and tw < .2]
    before_co = [v.co.copy() for v in band]
    for _ in range(int(SMOOTH_IT)):
        if SMOOTH_MODE == 0: bmesh.ops.smooth_laplacian_vert(bm, verts=band, lambda_factor=SMOOTH_L, lambda_border=0, use_x=True, use_y=True, use_z=True, preserve_volume=True)
        else: bmesh.ops.smooth_vert(bm, verts=band, factor=SMOOTH_L, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    print('[relax] %d verts, mean move %.2f mm' % (len(band), 1e3 * sum((v.co - c).length for v, c in zip(band, before_co)) / max(1, len(band))))
    bm.to_mesh(me.data); bm.free(); me.data.update()
    apply_taper('2')
me.data.update()
me.data.shade_smooth()
after = measure(me, XR, C3, 'after inflation')
profile(me, W, AX, EX, EY, 'after', ds=[x / 1000 for x in range(-50, 61, 5)])
thenar(me, JB, 'after')

# ------------------------------------------------------------------ skin vertex colour: warm fingertips and knuckles
# multiplies the page's toon ramp; (1, .9, .87) is a gentle pink/red shift, applied with a soft falloff
def tint_amount(p, groups):
    a = 0.0
    for g in groups:
        nm = vgn[g.group]
        if nm.endswith('-tip') or nm.endswith('phalanx-distal'): a = max(a, g.weight)
    # knuckles: near the MCP and PIP joints, on the back of the hand
    for f in ['index', 'middle', 'ring', 'pinky']:
        for jn, r0 in ((f + '-finger-phalanx-proximal', .011), (f + '-finger-phalanx-intermediate', .008)):
            q = p - JB[jn]
            if q.dot(RB[jn] @ Vector((0, 1, 0))) > 0:
                a = max(a, .75 * (1 - sstep(r0 * .5, r0 * 1.5, q.length)))
    return a
col = me.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
PINK = (1.0, .90, .87)
for v in me.data.vertices:
    k = tint_amount(MW @ v.co, v.groups)
    col.data[v.index].color = (1 + (PINK[0] - 1) * k, 1 + (PINK[1] - 1) * k, 1 + (PINK[2] - 1) * k, 1)
me.data.color_attributes.active_color = col
for uv in list(me.data.uv_layers): me.data.uv_layers.remove(uv)
me.data.materials.clear()
print('[build] hand mesh: %d verts, %d faces' % (len(me.data.vertices), len(me.data.polygons)))

# ------------------------------------------------------------------ the sleeve (wearer's jacket), rigid on the forearm bone
# Elliptical tube on the forearm's axis (offset a little toward the back of the forearm, where a sleeve rests),
# from the cuff edge at CUFF to the elbow and beyond. The cuff edge is a rolled lip that turns into an inner wall
# (the inside of the sleeve, dark), so the opening has thickness. A stitched seam loop sits SEAM past the edge.
CUFF, SEAM, END = .040, .050, .46
def srxy(d):   # sleeve half-widths (m): ~8.4 x 6.8 cm at the cuff, widening toward the elbow
    u = (d - CUFF) / (.30 - CUFF)
    return .042 + .016 * u, .034 + .016 * u
SOY = .004      # centre offset toward the back of the forearm
NS = 40
def sring(d, dr=0.0):
    ex, ey = srxy(max(d, CUFF))
    out = []
    for i in range(NS):
        a = 2 * math.pi * i / NS
        x, y = math.cos(a) * (ex + dr), math.sin(a) * (ey + dr)
        out.append(W + EX * (x + cx) + EY * (y + cy + SOY) + AX * d)
    return out
# (d, radial offset, colour): outer surface from the lip toward the elbow, then the inner wall back to the lip
T = .003   # cloth thickness
PROFILE_OUT = [(CUFF + .0015, -.0015 + .0004), (CUFF + .004, 0), (CUFF + .009, 0), (SEAM - .0025, 0), (SEAM - .0008, .0011),
               (SEAM + .0008, .0011), (SEAM + .0025, 0), (.075, 0), (.11, 0), (.15, 0), (.20, 0), (.26, 0), (.33, 0), (.40, 0), (END, 0)]
PROFILE_IN = [(CUFF + .060, -T), (CUFF + .012, -T), (CUFF + .003, -T), (CUFF, -T * .55), (CUFF - .0004, -T * .1)]
def scol(d, dr, inner):
    if inner: return (.42, .42, .45)
    c = 1.0
    if abs(d - SEAM) < .0012: c = .74                 # the stitched seam
    elif d < SEAM: c = 1.05                           # the cuff band, a hair lighter
    c *= 1 - .22 * sstep(.08, .30, d)                 # darker toward the elbow (receding toward the body)
    return (c, c, c)
smesh = bpy.data.meshes.new('sleeve')
sb = bmesh.new()
rings, cols = [], []
for (d, dr) in PROFILE_OUT[::-1]:   # from the far end to the lip
    rings.append([sb.verts.new(MWi @ p) for p in sring(d, dr)]); cols.append(scol(d, dr, False))
# lip: continue from the outer lip ring, round the edge, into the inner wall
for (d, dr) in PROFILE_IN:
    rings.append([sb.verts.new(MWi @ p) for p in sring(d, dr)]); cols.append(scol(d, dr, dr <= -T * .5))
for r0, r1 in zip(rings, rings[1:]):
    for i in range(NS):
        sb.faces.new((r0[i], r0[(i + 1) % NS], r1[(i + 1) % NS], r1[i]))
sb.normal_update()
# outward normals for the outer surface: check one face on the outer surface
sb.faces.ensure_lookup_table()
f0 = sb.faces[NS * 3]
cen = sum((v.co for v in f0.verts), Vector()) / 4
axis_pt = MWi @ (W + EX * cx + EY * (cy + SOY) + AX * ((MW @ cen) - W).dot(AX))
if f0.normal.dot(cen - axis_pt) < 0:
    for f in sb.faces: f.normal_flip()
sb.to_mesh(smesh); sb.free()
sleeve = bpy.data.objects.new('sleeve', smesh)
bpy.context.scene.collection.objects.link(sleeve)
sleeve.matrix_world = MW.copy()
sleeve.parent = arm; sleeve.matrix_parent_inverse = arm.matrix_world.inverted()
mod = sleeve.modifiers.new('arm', 'ARMATURE'); mod.object = arm
svg = sleeve.vertex_groups.new(name='forearm')
svg.add(list(range(len(smesh.vertices))), 1.0, 'REPLACE')
scol_attr = smesh.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
for ri, c in enumerate(cols):
    for i in range(NS): scol_attr.data[ri * NS + i].color = (c[0], c[1], c[2], 1)
smesh.color_attributes.active_color = scol_attr
smesh.shade_smooth()
print('[build] sleeve mesh: %d verts, %d faces' % (len(smesh.vertices), len(smesh.polygons)))

# ------------------------------------------------------------------ export
TMP = OUT + '.raw.glb'
bpy.ops.export_scene.gltf(filepath=TMP, export_format='GLB', use_selection=False, export_yup=True,
                          export_texcoords=False, export_normals=True, export_tangents=False,
                          export_materials='NONE', export_vertex_color='ACTIVE', export_all_vertex_colors=False,
                          export_skins=True, export_animations=False,
                          export_morph=False, export_apply=False, export_all_influences=False,
                          export_def_bones=False, export_rest_position_armature=True)

# ------------------------------------------------------------------ post-process: WebXR joint frames, hierarchy
j, binbuf = read_glb(TMP)
nodes = j['nodes']
parent = {}
for i, n in enumerate(nodes):
    for c in n.get('children', []): parent[c] = i
def world(i):
    m = node_local(nodes[i])
    while i in parent: i = parent[i]; m = node_local(nodes[i]) @ m
    return m
assert len(j['skins']) == 1, 'expected the hand and the sleeve to share one skin, got %d' % len(j['skins'])
skin = j['skins'][0]
joints = skin['joints']
name2node = {nodes[i]['name']: i for i in joints}
assert set(name2node) == set(XR), (set(name2node) ^ set(XR))
acc = j['accessors'][skin['inverseBindMatrices']]
bv = j['bufferViews'][acc['bufferView']]
base = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
def get_mat(k):
    f = struct.unpack_from('<16f', binbuf, base + 64 * k)
    return Matrix([[f[c * 4 + r] for c in range(4)] for r in range(4)])
def put_mat(k, m):
    struct.pack_into('<16f', binbuf, base + 64 * k, *[m[r][c] for c in range(4) for r in range(4)])
old_world = {nodes[i]['name']: world(i) for i in joints}
for nm in XR:
    dt = (old_world[nm].to_translation() - XR[nm].to_translation()).length
    assert dt < 1e-4, ('joint moved in export', nm, dt)
for k, i in enumerate(joints):
    nm = nodes[i]['name']
    put_mat(k, XR[nm].inverted() @ old_world[nm] @ get_mat(k))
arm_i = parent[name2node['forearm']]
A = world(arm_i)
for i in joints: nodes[i].pop('children', None)
for n in nodes:
    if 'children' in n: n['children'] = [c for c in n['children'] if c not in joints]
FINGERS = ['index', 'middle', 'ring', 'pinky']
CH = [['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip']] + \
     [[f + '-finger-' + b for b in ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip']] for f in FINGERS]
PARENT = {'forearm': None, 'wrist': 'forearm'}
for c in CH:
    PARENT[c[0]] = 'wrist'
    for a, b in zip(c, c[1:]): PARENT[b] = a
for nm, pn in PARENT.items():
    pw = A if pn is None else XR[pn]
    loc = pw.inverted() @ XR[nm]
    t, q, s = loc.decompose()
    n = nodes[name2node[nm]]
    n['translation'] = [t.x, t.y, t.z]
    n['rotation'] = [q.x, q.y, q.z, q.w]
    n.pop('scale', None); n.pop('matrix', None)
    holder = nodes[arm_i] if pn is None else nodes[name2node[pn]]
    holder.setdefault('children', []).append(name2node[nm])
skin['skeleton'] = name2node['forearm']
j['asset']['copyright'] = 'Hand mesh: WebXR Input Profiles generic-hand, MIT (c) 2019 Amazon. Forearm, finger volume, sleeve, weights and subdivision added for jimburch.com.'
# mesh nodes are identity transforms in the export (both meshes live in armature space); the page relies on it
for n in nodes:
    if 'mesh' in n:
        for k in ('translation', 'rotation', 'scale', 'matrix'): n.pop(k, None)

# ------------------------------------------------------------------ quantize (KHR_mesh_quantization)
# positions int16 with ONE quantization (shared by both meshes, since they share the skin's inverse binds, where
# it is folded in), normals int8, colours uint8, weights uint8, joints uint8, indices uint16.
def acc_data(k):
    a = j['accessors'][k]; bv = j['bufferViews'][a['bufferView']]
    n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
    fmt = {5126: 'f', 5121: 'B', 5123: 'H', 5125: 'I'}[a['componentType']]
    size = struct.calcsize('<' + fmt)
    stride = bv.get('byteStride', n * size)
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    vals = [struct.unpack_from('<%d%s' % (n, fmt), binbuf, off + i * stride) for i in range(a['count'])]
    if a.get('normalized') and fmt in 'BH':
        mx = 255.0 if fmt == 'B' else 65535.0
        vals = [tuple(c / mx for c in v) for v in vals]
    return vals
prims = [(m['name'], p) for m in j['meshes'] for p in m['primitives']]
assert len(prims) == 2, [m['name'] for m in j['meshes']]
data = {}
for nm, p in prims:
    a = p['attributes']
    data[nm] = dict(P=acc_data(a['POSITION']), N=acc_data(a['NORMAL']), J=acc_data(a['JOINTS_0']), Wt=acc_data(a['WEIGHTS_0']),
                    C=acc_data(a['COLOR_0']), I=acc_data(p['indices']))
IBM = [get_mat(k) for k in range(len(joints))]
allP = [q for d in data.values() for q in d['P']]
lo = [min(p[i] for p in allP) for i in range(3)]; hi = [max(p[i] for p in allP) for i in range(3)]
scale = max(hi[i] - lo[i] for i in range(3)) / 65000.0
cen = [(lo[i] + hi[i]) / 2 for i in range(3)]
Q = Matrix.Translation(Vector(cen)) @ Matrix.Diagonal((scale, scale, scale, 1))   # quantized -> metres
out = bytearray(); views = []; accs = []
def add_view(dat, stride=None, target=None):
    while len(out) % 4: out.append(0)
    v = {'buffer': 0, 'byteOffset': len(out), 'byteLength': len(dat)}
    if stride: v['byteStride'] = stride
    if target: v['target'] = target
    out.extend(dat); views.append(v); return len(views) - 1
for nm, prim in prims:
    d = data[nm]; P = d['P']
    qp = bytearray(); qs = []
    for p in P:
        q = [max(-32767, min(32767, round((p[i] - cen[i]) / scale))) for i in range(3)]
        qp += struct.pack('<3hxx', *q); qs.append(q)
    a_pos = len(accs); accs.append({'bufferView': add_view(qp, 8, 34962), 'componentType': 5122, 'count': len(P), 'type': 'VEC3',
                                   'min': [min(q[i] for q in qs) for i in range(3)], 'max': [max(q[i] for q in qs) for i in range(3)]})
    qn = bytearray()
    for nrm in d['N']:
        l = math.sqrt(sum(c * c for c in nrm)) or 1
        qn += struct.pack('<3bx', *[max(-127, min(127, round(c / l * 127))) for c in nrm])
    a_nrm = len(accs); accs.append({'bufferView': add_view(qn, 4, 34962), 'componentType': 5120, 'normalized': True, 'count': len(P), 'type': 'VEC3'})
    qc = bytearray()
    for c in d['C']: qc += bytes([max(0, min(255, round(c[i] * 255))) for i in range(3)] + [255])
    a_col = len(accs); accs.append({'bufferView': add_view(qc, 4, 34962), 'componentType': 5121, 'normalized': True, 'count': len(P), 'type': 'VEC4'})
    a_jnt = len(accs); accs.append({'bufferView': add_view(bytes(b for jj in d['J'] for b in jj), 4, 34962), 'componentType': 5121, 'count': len(P), 'type': 'VEC4'})
    qw = bytearray()
    for w in d['Wt']:
        r = [round(c * 255) for c in w]; r[r.index(max(r))] += 255 - sum(r); qw += bytes(r)
    a_wt = len(accs); accs.append({'bufferView': add_view(qw, 4, 34962), 'componentType': 5121, 'normalized': True, 'count': len(P), 'type': 'VEC4'})
    a_idx = len(accs); accs.append({'bufferView': add_view(b''.join(struct.pack('<H', i[0]) for i in d['I']), None, 34963), 'componentType': 5123, 'count': len(d['I']), 'type': 'SCALAR'})
    prim['attributes'] = {'POSITION': a_pos, 'NORMAL': a_nrm, 'COLOR_0': a_col, 'JOINTS_0': a_jnt, 'WEIGHTS_0': a_wt}
    prim['indices'] = a_idx
    prim.pop('material', None)
    print('[build] quantized %s: %d verts, %d tris' % (nm, len(P), len(d['I']) // 3))
ibm = bytearray()
for m in IBM:
    m2 = m @ Q
    ibm += struct.pack('<16f', *[m2[r][c] for c in range(4) for r in range(4)])
accs.append({'bufferView': add_view(ibm), 'componentType': 5126, 'count': len(IBM), 'type': 'MAT4'})
skin['inverseBindMatrices'] = len(accs) - 1
j['accessors'] = accs; j['bufferViews'] = views; j['buffers'] = [{'byteLength': len(out)}]
j.pop('materials', None)
j['extensionsUsed'] = ['KHR_mesh_quantization']; j['extensionsRequired'] = ['KHR_mesh_quantization']
binbuf = out
print('[build] position step %.2f um' % (scale * 1e6))
write_glb(OUT, j, binbuf)
os.remove(TMP)
print('[build] wrote', OUT, os.path.getsize(OUT), 'bytes')
