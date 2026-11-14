"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
export function MediaEditor({
  label,
  value,
  slot,
  onChange,
}: {
  label: string;
  value: string;
  slot: string;
  onChange: (url: string) => void;
}) {
  const [source, setSource] = useState(""),
    [rotation, setRotation] = useState(0),
    [zoom, setZoom] = useState(1),
    [x, setX] = useState(0),
    [y, setY] = useState(0),
    [watermark, setWatermark] = useState(false),
    [text, setText] = useState("Be Neighbor"),
    [color, setColor] = useState("#ffffff"),
    [position, setPosition] = useState("bottom-right"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);
  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source);
    },
    [source],
  );
  async function draw(canvas: HTMLCanvasElement, width: number) {
    const image = new Image();
    image.src = source;
    await image.decode();
    canvas.width = width;
    canvas.height = Math.round((width * 9) / 16);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    const h = canvas.height,
      swapped = rotation % 180 !== 0,
      iw = swapped ? image.height : image.width,
      ih = swapped ? image.width : image.height,
      scale = Math.max(width / iw, h / ih) * zoom;
    ctx.fillStyle = "#eaf3f2";
    ctx.fillRect(0, 0, width, h);
    ctx.save();
    ctx.translate(
      width / 2 + (x / 100) * Math.max(0, iw * scale - width),
      h / 2 + (y / 100) * Math.max(0, ih * scale - h),
    );
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      image,
      (-image.width * scale) / 2,
      (-image.height * scale) / 2,
      image.width * scale,
      image.height * scale,
    );
    ctx.restore();
    if (watermark) {
      ctx.font = `700 ${width / 40}px Arial`;
      ctx.fillStyle = color;
      const left = position.includes("left"),
        top = position.includes("top");
      ctx.textAlign =
        position === "center" ? "center" : left ? "left" : "right";
      ctx.textBaseline = top ? "top" : "bottom";
      ctx.fillText(
        text,
        position === "center" ? width / 2 : left ? width * 0.04 : width * 0.96,
        position === "center" ? h / 2 : top ? h * 0.06 : h * 0.94,
        width * 0.9,
      );
    }
  }
  useEffect(() => {
    if (source && preview.current)
      draw(preview.current, 640).catch(() => setError("无法读取图片"));
  }, [source, rotation, zoom, x, y, watermark, text, color, position]);
  function pick(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("请选择 JPG、PNG 或 WebP 图片，最大 5 MB");
      return;
    }
    setError("");
    setSource(URL.createObjectURL(file));
    setRotation(0);
    setZoom(1);
    setX(0);
    setY(0);
  }
  async function upload() {
    setBusy(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      await draw(canvas, 1600);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("无法导出图片");
      const form = new FormData();
      form.append("file", blob, `${slot}.jpg`);
      form.append("slot", slot);
      const r = await fetch("/api/admin/media", { method: "POST", body: form });
      const d = (await r.json()) as { url: string; error?: string };
      if (!r.ok) throw new Error(d.error);
      onChange(d.url);
      setSource("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="mb-3 text-base font-bold">{label}</p>
      <div className="overflow-hidden rounded-xl border bg-[#edf7f6]">
        {source ? (
          <canvas ref={preview} className="aspect-video w-full" />
        ) : value ? (
          <img
            src={value}
            alt={label}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <p className="p-8 text-base text-slate-500">尚未选择图片</p>
        )}
        <div className="space-y-4 bg-white p-4">
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border px-4 font-bold">
            选择图片
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
          <p className="text-sm text-slate-500">
            最大 5 MB，可按 16:9 调整裁剪并保持比例。
          </p>
          {source && (
            <>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setRotation((rotation + 270) % 360)}
                >
                  向左旋转90°
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setRotation((rotation + 90) % 360)}
                >
                  向右旋转90°
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["裁剪缩放", zoom, setZoom, 1, 3],
                  ["水平位置", x, setX, -50, 50],
                  ["垂直位置", y, setY, -50, 50],
                ].map(([label, n, set, min, max]) => (
                  <label key={String(label)} className="text-sm font-bold">
                    {String(label)}
                    <input
                      className="mt-2 w-full"
                      type="range"
                      min={Number(min)}
                      max={Number(max)}
                      step="0.01"
                      value={Number(n)}
                      onChange={(e) =>
                        (set as (n: number) => void)(Number(e.target.value))
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="flex min-h-11 items-center gap-3">
                <Switch checked={watermark} onCheckedChange={setWatermark} />
                文字水印
              </label>
              {watermark && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    value={text}
                    maxLength={100}
                    onChange={(e) => setText(e.target.value)}
                    aria-label="Watermark text"
                  />
                  <label className="flex items-center gap-3 text-sm">
                    颜色
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Watermark position"
                    className="min-h-11 rounded-lg border p-2"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  >
                    {[
                      "top-left",
                      "top-right",
                      "bottom-left",
                      "bottom-right",
                      "center",
                    ].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
              <Button
                type="button"
                className="min-h-12"
                disabled={busy}
                onClick={upload}
              >
                {busy ? "上传中…" : "保存裁剪并上传"}
              </Button>
            </>
          )}
        </div>
      </div>
      <Input
        className="mt-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="或粘贴已确认的图片地址"
      />
      {error && (
        <p role="alert" className="mt-3 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
