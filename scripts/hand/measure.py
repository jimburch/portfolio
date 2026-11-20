# measure(me, XR, C3): widths of each digit segment (radial-ulnar X and dorso-palmar Y, mm) at mid-segment,
# and the palm width across the MCP level. Bind pose, Blender space.
from mathutils import Vector
FING = ['index', 'middle', 'ring', 'pinky']
def seg_of(XR, C3):
    J = {k: C3 @ v.to_translation() for k, v in XR.items()}
    R = {k: C3 @ v.to_3x3() for k, v in XR.items()}
    segs = {}
    for f in FING:
        c = [f + '-finger-' + b for b in ['phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip']]
        for a, b in zip(c, c[1:]): segs[a] = (J[a], J[b], R[a])
    c = ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip']
    for a, b in zip(c, c[1:]): segs[a] = (J[a], J[b], R[a])
    return J, R, segs
def measure(me, XR, C3, label=''):
    J, R, segs = seg_of(XR, C3)
    vg = {g.index: g.name for g in me.vertex_groups}
    M = me.matrix_world
    out = {}
    verts = [(M @ v.co, {vg[g.group]: g.weight for g in v.groups}) for v in me.data.vertices]
    for nm, (h, t, r) in segs.items():
        ax = (t - h); L = ax.length; ax.normalize()
        X = (r @ Vector((1, 0, 0))).normalized(); Y = (r @ Vector((0, 1, 0))).normalized()
        xs, ys = [], []
        for p, w in verts:
            u = (p - h).dot(ax) / L
            if .4 < u < .6 and w.get(nm, 0) > .5:
                q = p - h - ax * (p - h).dot(ax)
                xs.append(q.dot(X)); ys.append(q.dot(Y))
        if xs: out[nm] = (round((max(xs) - min(xs)) * 1000, 1), round((max(ys) - min(ys)) * 1000, 1), len(xs))
    # palm: verts near the line through the 4 MCP joints (within 6 mm along the hand axis), width along the wrist X
    W = J['wrist']; RW = R['wrist']; X = (RW @ Vector((1, 0, 0))).normalized(); Z = (RW @ Vector((0, 0, 1))).normalized()
    mcpd = sum((J[f + '-finger-phalanx-proximal'] - W).dot(Z) for f in FING) / 4 + .012   # a bit proximal of the knuckles
    xs = [(p - W).dot(X) for p, w in verts if abs((p - W).dot(Z) - mcpd) < .004 and not any(k.startswith('thumb') for k in w if w[k] > .3)]
    out['palm'] = round((max(xs) - min(xs)) * 1000, 1)
    print('[measure %s] palm %.1f mm' % (label, out['palm']))
    for nm in segs:
        if nm in out: print('   %-34s X %5.1f  Y %5.1f mm (n=%d)  ratio X/palm %.2f' % (nm, out[nm][0], out[nm][1], out[nm][2], out[nm][0] / out['palm']))
    return out

def profile(me, W, AX, EX, EY, label='', ds=None):
    """cross-section extents across the wrist/forearm axis: for each d (m along AX from the wrist joint; <0 = toward
    the fingers) the radial-ulnar (EX) and dorso-palmar (EY) extent of the skin, thumb-weighted verts excluded."""
    vg = {g.index: g.name for g in me.vertex_groups}
    M = me.matrix_world
    ds = ds or [-.05, -.04, -.03, -.02, -.01, 0, .01, .02, .03, .04, .05, .07, .09]
    print('[profile %s]' % label)
    out = {}
    for d in ds:
        xs, ys = [], []
        for v in me.data.vertices:
            p = M @ v.co - W
            if abs(p.dot(AX) - d) > .0025: continue
            if any(vg[g.group].startswith('thumb') and g.weight > .3 for g in v.groups): continue
            xs.append(p.dot(EX)); ys.append(p.dot(EY))
        if xs:
            out[d] = (max(xs) - min(xs), max(ys) - min(ys))
            print('   d %+5.0f mm  X %5.1f mm (%+5.1f..%+5.1f)  Y %5.1f mm' % (d * 1000, out[d][0] * 1000, min(xs) * 1000, max(xs) * 1000, out[d][1] * 1000))
    return out

def thenar(me, JB, label=''):
    """the thumb-metacarpal region (thenar): verts whose strongest weight is the thumb metacarpal, distance from
    the metacarpal segment (m): percentiles, and the extent across the palm plane"""
    vg = {g.index: g.name for g in me.vertex_groups}
    M = me.matrix_world
    h, t = JB['thumb-metacarpal'], JB['thumb-phalanx-proximal']
    ax = t - h; L2 = ax.length_squared
    ds = []
    for v in me.data.vertices:
        if not v.groups: continue
        g = max(v.groups, key=lambda g: g.weight)
        if vg[g.group] != 'thumb-metacarpal' or g.weight < .5: continue
        p = M @ v.co
        u = max(0.0, min(1.0, (p - h).dot(ax) / L2))
        ds.append((p - (h + ax * u)).length)
    ds.sort()
    if ds:
        q = lambda f: ds[min(len(ds) - 1, int(f * len(ds)))] * 1000
        print('[thenar %s] n=%d  dist from metacarpal seg: p50 %.1f  p90 %.1f  max %.1f mm' % (label, len(ds), q(.5), q(.9), ds[-1] * 1000))
