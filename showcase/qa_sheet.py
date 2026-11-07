# Contact sheet of a frame sequence (or a video) for QA: one tile every `step` seconds.
# Usage: python3 showcase/qa_sheet.py <frames-dir|video.mp4> <out.jpg> [step=1] [tile_w=360] [cols=6]
import cv2, glob, sys
import numpy as np

src, out = sys.argv[1], sys.argv[2]
step = float(sys.argv[3]) if len(sys.argv) > 3 else 1
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 360
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 6
FPS = 30

if src.endswith(".mp4"):
    cap = cv2.VideoCapture(src)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    def get(i):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        return cap.read()[1]
else:
    files = sorted(glob.glob(f"{src}/*.jpg"))
    n = len(files)
    get = lambda i: cv2.imread(files[i])

tiles = []
t = 0.0
while round(t * FPS) < n:
    im = get(int(round(t * FPS)))
    im = cv2.resize(im, (tw, int(im.shape[0] * tw / im.shape[1])), interpolation=cv2.INTER_AREA)
    cv2.putText(im, f"{t:.1f}s", (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40, 40, 220), 2)
    tiles.append(im)
    t += step
h = tiles[0].shape[0]
while len(tiles) % cols:
    tiles.append(np.full_like(tiles[0], 255))
rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
print(out, len(tiles), "tiles")
