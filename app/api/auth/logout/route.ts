import { NextResponse } from "next/server";
import { customerCookieName } from "@/lib/customer-auth";
export async function POST(){const r=NextResponse.json({ok:true});r.cookies.set(customerCookieName,"",{httpOnly:true,path:"/",maxAge:0});return r;}
