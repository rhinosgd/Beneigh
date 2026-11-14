"use client";
import { Mail, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SiteLang } from "./site-header";
export function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="currentColor"
    >
      <path d="M20.52 3.48A11.85 11.85 0 0 0 1.87 17.77L.2 23.8l6.18-1.62a11.83 11.83 0 0 0 5.65 1.44h.01A11.85 11.85 0 0 0 20.52 3.48ZM12.04 21.6a9.82 9.82 0 0 1-5-1.36l-.36-.21-3.67.96.98-3.58-.24-.37a9.83 9.83 0 1 1 8.29 4.56Zm5.39-7.37c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.29-.76.97-.93 1.17-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.48-.88-.78-1.48-1.75-1.65-2.04-.17-.3-.02-.45.13-.59.13-.13.29-.34.44-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.03-.52-.07-.15-.66-1.6-.91-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.28.29-1.04 1.01-1.04 2.47 0 1.45 1.07 2.86 1.21 3.05.15.2 2.09 3.2 5.06 4.49.71.31 1.26.5 1.69.63.71.22 1.37.19 1.89.12.57-.08 1.76-.72 2.01-1.41.24-.69.24-1.28.17-1.4-.08-.13-.28-.2-.58-.35Z" />
    </svg>
  );
}
export function WeChatIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="currentColor"
    >
      <path d="M8.7 2C3.9 2 0 5.1 0 9c0 2.2 1.2 4.1 3.1 5.4l-.8 2.4 2.8-1.4c1.1.4 2.3.6 3.6.6.3 0 .6 0 .9-.1A6.9 6.9 0 0 1 9.2 13c0-4 3.8-7.2 8.5-7.2h.5C16.8 3.5 13.2 2 8.7 2Zm-3 4.6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM17 7c-3.9 0-7 2.6-7 5.8 0 3.3 3.1 5.9 7 5.9 1 0 2-.2 2.9-.5l2.3 1.2-.6-2.1c1.5-1.1 2.4-2.7 2.4-4.5C24 9.6 20.9 7 17 7Zm-2.4 3.8a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.8 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z" />
    </svg>
  );
}
export function QuickContact({
  content = {},
  lang = "en",
}: {
  content?: Record<string, string>;
  lang?: SiteLang;
}) {
  const zh = lang === "zh";
  const valid = /^https:\/\/(u\.wechat\.com|work\.weixin\.qq\.com)\//.test(
    content.wechat_chat_url || "",
  );
  const button =
    "inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-5 text-base font-bold transition hover:-translate-y-0.5 active:scale-95";
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <a
        className={`${button} bg-[#25d366] text-[#063b25]`}
        href="https://wa.me/8613912345678"
        target="_blank"
        rel="noopener noreferrer"
      >
        <WhatsAppIcon />
        WhatsApp
      </a>
      {valid ? (
        <a
          className={`${button} bg-[#07c160] text-white`}
          href={content.wechat_chat_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WeChatIcon />
          WeChat
        </a>
      ) : (
        <Dialog>
          <DialogTrigger className={`${button} bg-[#07c160] text-white`}>
            <WeChatIcon />
            WeChat
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
            <DialogTitle>{zh ? "通过微信联系" : "Contact On WeChat"}</DialogTitle>
            </DialogHeader>
            {content.wechat_qr_image ? (
              <img
                src={content.wechat_qr_image}
                alt="Scan with WeChat to contact Beneigh"
                className="mx-auto max-h-72 max-w-full"
              />
            ) : (
              <p className="text-base leading-7">
                {zh ? "微信聊天链接或联系二维码尚未接入。完成设置前，请使用 WhatsApp、电话或电邮联系。" : "The WeChat chat link or contact QR code has not been connected yet. Please use WhatsApp, phone or email while it is being set up."}
              </p>
            )}
          </DialogContent>
        </Dialog>
      )}
      <a
        className={`${button} border border-[#b9d6d3] bg-white`}
        href="tel:+8613912345678"
      >
        <Phone size={20} />
        +86 139 1234 5678
      </a>
      <a
        className={`${button} border border-[#b9d6d3] bg-white`}
        href="mailto:info@beneigh.com"
      >
        <Mail size={20} />
        info@beneigh.com
      </a>
    </div>
  );
}
