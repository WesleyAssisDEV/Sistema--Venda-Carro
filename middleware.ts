import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Atualiza os cookies no request
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          
          // Atualiza o response com os novos headers
          response = NextResponse.next({
            request,
          });
          
          // Aplica os cookies no response com as opções completas
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const ADMIN_PATH = '/gestao-interna-segura';
  const isLoginPage = request.nextUrl.pathname === `${ADMIN_PATH}/login`;
  const isAdminRoute = request.nextUrl.pathname.startsWith(ADMIN_PATH);

  if (isAdminRoute && !isLoginPage && !session) {
    return NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
  }

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL(`${ADMIN_PATH}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/gestao-interna-segura/:path*'],
};