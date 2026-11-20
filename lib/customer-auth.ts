import { createHmac, timingSafeEqual, scryptSync, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
const COOKIE="nextronixt_customer";
function secret(){const v=process.env.AUTH_SECRET;if(!v)throw new Error("AUTH_SECRET no está configurada.");return v;}
export function hashPassword(password:string){const salt=randomBytes(16).toString("hex");const hash=scryptSync(password,salt,64).toString("hex");return salt+":"+hash;}
export function verifyPassword(password:string,stored:string){try{const [salt,hash]=stored.split(":");const actual=scryptSync(password,salt,64);const expected=Buffer.from(hash,"hex");return actual.length===expected.length&&timingSafeEqual(actual,expected);}catch{return false;}}
function sign(value:string){return createHmac("sha256",secret()).update(value).digest("hex");}
export function createCustomerToken(id:string){const payload=JSON.stringify({id,exp:Date.now()+1000*60*60*24*30});return Buffer.from(payload).toString("base64url")+"."+sign(payload);}
export function verifyCustomerToken(token:string){try{const [encoded,sig]=token.split(".");const payload=Buffer.from(encoded,"base64url").toString();const expected=sign(payload);const a=Buffer.from(sig),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return null;const data=JSON.parse(payload);return data.exp>Date.now()?String(data.id):null;}catch{return null;}}
export async function getCustomerId(){const jar=await cookies();return verifyCustomerToken(jar.get(COOKIE)?.value||"");}
export const customerCookieName=COOKIE;
