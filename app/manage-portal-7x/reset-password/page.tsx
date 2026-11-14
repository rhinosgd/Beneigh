"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormIssueList,
  clearInvalidFields,
  collectFormIssues,
  markInvalidFields,
  summaryText,
  type FieldIssue,
} from "../../components/form-validation";

export default function ResetPasswordPage(){
  const [token,setToken]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [message,setMessage]=useState("");
  const [issues,setIssues]=useState<FieldIssue[]>([]);
  useEffect(()=>setToken(new URLSearchParams(location.search).get("token")||""),[]);
  async function submit(e:React.FormEvent){e.preventDefault();const form=e.currentTarget;const found=collectFormIssues(form,"zh");setIssues(found);if(found.length){const first=markInvalidFields(form,"zh");first?.focus();setMessage(summaryText(found,"zh"));return}clearInvalidFields(form);setMessage("");if(password!==confirm){setMessage("两次输入的密码不一致");return}const r=await fetch("/api/admin/password/reset",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,newPassword:password})});const out=await r.json() as {ok?:boolean;error?:string};setMessage(r.ok?"密码已重设，请返回管理端登录":out.error||"重设失败");}
  return <main className="grid min-h-screen place-items-center bg-[#153f3c] p-5"><form onSubmit={submit} noValidate className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"><FormIssueList issues={issues} lang="zh"/><p className="text-sm font-bold text-[#0f8b82]">安全管理入口</p><h1 className="mt-2 text-3xl font-bold">重设管理员密码</h1><Input className="mt-7" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="新密码（至少6位，含小写字母和数字）" minLength={6} required/><Input className="mt-3" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="再次输入新密码" minLength={6} required/><Button className="mt-5 w-full" type="submit" disabled={!token}>重设密码</Button>{message&&<p className="mt-3 text-sm text-slate-600">{message}</p>}<a className="mt-4 block text-center text-sm text-[#0f6d68] underline" href="/manage-portal-7x">返回登录</a></form></main>;
}
