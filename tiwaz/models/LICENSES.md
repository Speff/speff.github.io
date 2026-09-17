# Model licenses

`asaro.glb` is omitted from this public build: it's under a personal, non-commercial
EULA (see its row below), so it isn't shipped here, only on the private deploy.

All models below are single-mesh, POSITION-only geometry (no materials, textures,
skins, or animations — the app discards those on load and only uses triangle
positions). Formats are `.glb` (glTF 2.0 binary), none Draco-compressed. Triangle
counts were computed by summing `indices.count / 3` (or `POSITION.count / 3` when
non-indexed) across all mesh primitives in each file's JSON chunk.

`plant.glb` was replaced with a higher-fidelity source (see processing notes below);
`figure.glb`, `car.glb`, and `fox.glb` are unchanged from the previous set. `dog.glb`
(Quaternius's German Shepherd, CC BY 3.0) was dropped from the library on 2026-09-16; the
processing notes below still describe it for the record.

| File | Subject | Triangles | Author | License | Source |
|---|---|---|---|---|---|
| `plant.glb` | Potted umbrella palm tree | 1,760 | Poly by Google | CC BY 3.0 — https://creativecommons.org/licenses/by/3.0/ | https://poly.pizza/m/8Qwgncb6dJT |
| `car.glb` | Car | 2,854 | Quaternius | CC BY 3.0 — https://creativecommons.org/licenses/by/3.0/ | https://poly.pizza/m/HQ0hvRM2XR |
| `figure.glb` | Human figure (standing, "Animated Human" base) | 1,578 | Quaternius | CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ | https://poly.pizza/m/c3Ibh9I3udk |
| `asaro.glb` | Asaro planar head (John Asaro's "Planes of the Head" study cast) | 158,556 | Adam Fisher | Custom store EULA — personal, non-commercial use; check its terms before shipping this file in a public build | https://afisher.com.au/store/Wrb61/asaro-planes-of-the-head |
| `fox.glb` | Fox (secondary organic form / four-legged animal) | 576 | PixelMannen (model, CC0); tomkranis (rigging/animation, CC BY 4.0); AsoboStudio & scurest (glTF conversion, CC BY 4.0) | CC0 1.0 for the base model; CC BY 4.0 for rigging/animation/conversion — https://creativecommons.org/publicdomain/zero/1.0/ and https://creativecommons.org/licenses/by/4.0/ | https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox (raw: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb) |

Total size: ~3.8 MB for all five files, 2.85 MB of which is `asaro.glb`.

## Processing (dog.glb, plant.glb)

Each source GLB was run through a gltf-transform (Node.js) pipeline: read with
`NodeIO` (`ALL_EXTENSIONS` registered), all node world transforms baked into a
single flattened primitive (skinned sources' bind-pose POSITION data is used
as-is — no bone deformation is applied, since only the rest-pose mesh is
needed), then `prune` + `dedup` to drop materials/textures/skins/animations,
`weld` (tolerance 1e-4) to merge duplicate vertices, and `simplify`
(`@gltf-transform/functions`, `MeshoptSimplifier`, error 0.005, `lockBorder:
false`) with the ratio picked by binary search to land within ~20% of a target
triangle count (or left near-source-count where the source was already inside
the target range). Output is a single mesh/primitive with only a `POSITION`
accessor and indices. Verified on each output: 12-byte GLB header (`glTF`,
version 2, length field matches file size), zero degenerate (zero-area)
triangles, and a non-degenerate bounding box with a plausible axis ratio for
the subject.

- **`dog.glb`**: source is Quaternius's rigged "German Shepherd" (4,898 tris
  in bind pose, 22 animations and a skin dropped), lightly decimated to 4,286
  tris. Bounding box ratio ~1.0 : 1.9 : 3.1 (width : height : length),
  consistent with a standing quadruped, longer than tall, taller than wide.
- **`plant.glb`**: source is "Poly by Google"'s "Umbrella palm tree" (2,012
  tris, one material dropped), lightly decimated to 1,760 tris. Bounding box
  is roughly cubic (~1.07 : 1.20 : 1.0), consistent with a potted tree.

## Notes / substitutions

- **Head/bust**: `asaro.glb` is Adam Fisher's Asaro planar head
  (https://afisher.com.au/store/Wrb61/asaro-planes-of-the-head), converted from his ZBrush
  OBJ export (kept locally in `reference/`) with `scripts/obj2glb.mjs`, positions and indices
  only. It is licensed under the store's custom EULA for personal, non-commercial use, so
  check that EULA before shipping the file with a public build. A previously shipped
  Lee Perry-Smith scan (CC BY 3.0) was removed.
- **Dog**: settled on Quaternius's rigged "German Shepherd" (CC BY 3.0). It is a
  cartoon-adjacent asset-pack style rather than a photoreal scan, but it is
  anatomically proportioned (jointed legs/spine/tail rig, sane standing-quadruped
  bounding box) and its *un-decimated* triangle count (4,898) already sits inside the
  3,000–10,000 target, so it needed only light cleanup rather than invented detail.
  Several other candidates were downloaded and rejected first: a Quaternius/toofball
  "Great Dane" (CC BY 3.0) had a genuinely degenerate mesh — its own body width was
  ~9x thinner than its height/length, clearly a bad export — and every other
  poly.pizza dog/wolf/horse/deer candidate actually inspected (not just read from a
  thumbnail description) topped out around 500–2,000 triangles, i.e. decimation could
  only *remove* detail, never reach 3,000+ with real shape. Smithsonian 3D was
  inaccessible (see above); Thingiverse pages are a client-rendered SPA that returned
  no scrapeable content (title/license/geometry) through either fetch tool available
  here, so a Thingiverse STL could not be safely verified or downloaded.
- **Plant**: "Umbrella palm tree" by Poly by Google (CC BY 3.0), 2,012 source
  triangles, comfortably inside the 800–3,000 target. A second plant (reyshapes's CC0
  "Big Leaf Plant") was shipped for a while and dropped: its leaf geometry was too thin
  in places to read as a form.
- **Dog harness re-check**: re-inspected the German Shepherd source GLB
  (poly.pizza/m/Hssa6NPc6W) at the coordinator's request to see if the harness/pack
  visible on its back could be excluded. The file has exactly one mesh
  (`"GermanShepherd"`) with exactly one primitive (4,898 tris, one material
  `"Atlas"`), sharing one POSITION/NORMAL/TEXCOORD_0/JOINTS_0/WEIGHTS_0 buffer set —
  there is no separate harness/pack/vest/bag/collar/strap node, mesh, or primitive
  to skip. The armature's other ~70 nodes are all skeleton bones (Body, Back, Torso,
  Neck, Head, Ear, FrontLeg, BackLeg, Tail, IK/PoleTarget helpers), none named or
  shaped like gear. The harness geometry is welded into the single body mesh at the
  source and cannot be cleanly separated without manual per-triangle selection, so
  `dog.glb` was left as shipped.

## Subjects not separately covered

- A distinct **bird / hand / rock** was not added as a *second* extra organic form — only
  the fox was included — to stay within the 5–8 file / ~6 MB budget and because most
  candidates found for those subjects were either Sketchfab-gated (no account-free
  download), unclearly licensed ("free for personal use"), or clearly too dense /
  sculpted (many tens of thousands of triangles, meant for smooth-shaded rendering).

## Uncertain / please double check

- **`car.glb`**: poly.pizza's page for this specific Quaternius "Car" model displays
  **CC BY 3.0** (with a direct link to creativecommons.org/licenses/by/3.0/), whereas
  Quaternius's own itch.io/quaternius.com pages generally describe the same asset packs
  as CC0. I recorded it as CC BY 3.0 (author: Quaternius) per what the actual download
  page shows, which satisfies the "CC0 or CC-BY with author recorded" rule either way —
  but flagging the discrepancy in case you want to verify against quaternius.com
  directly before relying on it.
- **`dog.glb` realism**: this is the honest soft spot of the three replacements. The
  German Shepherd reads as a clean, well-proportioned, jointed dog model — a real
  step up from the previous fox-like low-poly dog — but it is still a stylized
  Quaternius asset-pack model, not a photogrammetry scan or sculpted-realism piece
  like the head. I could not reach a genuinely photoreal dog/quadruped in the
  3,000–10,000 triangle range through any source actually accessible to me
  (Smithsonian 3D blocked outright; Sketchfab excluded per instructions; Thingiverse
  unscrapeable for license/geometry verification; poly.pizza's whole catalog —
  including the "Poly by Google" archive — is explicitly a low/mid-poly game-asset
  library). If you have Sketchfab access or can reach 3d.si.edu directly, it's worth
  a second look before treating this as final.
