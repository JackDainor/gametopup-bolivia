import { NextResponse } from "next/server";
import { ensureSchema,getSql } from "@/lib/db";
import { getCustomerId } from "@/lib/customer-auth";
export async function GET(){const id=await getCustomerId();if(!id)return NextResponse.json({user:null});try{await ensureSchema();const sql=getSql();const rows=await sql`SELECT id,name,email,whatsapp FROM customers WHERE id=${id} LIMIT 1`;return NextResponse.json({user:rows[0]||null});}catch{return NextResponse.json({error:"No se pudo consultar la cuenta."},{status:503});}}
