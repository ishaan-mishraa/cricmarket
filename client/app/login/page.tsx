import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Shield } from 'lucide-react';

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const resolvedParams = await searchParams;
  const message = resolvedParams?.message;

  const signIn = async (formData: FormData) => {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return redirect('/login?message=Could not authenticate user');
    return redirect('/draft');
  };

  const signUp = async (formData: FormData) => {
    'use server';
    const origin = (await headers()).get('origin');
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (error) return redirect(`/login?message=${error.message}`);
    
    // Automatically create the manager profile after signup
    if (data.user) {
      await supabase.from('manager_profiles').insert({
        id: data.user.id,
        email: data.user.email,
        display_name: email.split('@')[0], // Default display name
      });
    }

    return redirect('/draft');
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-sm">
        
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Manager Portal</h1>
          <p className="mt-2 text-sm text-zinc-400">Sign in to access your $15M drafting purse.</p>
        </div>

        <form className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="email">
              Email Address
            </label>
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              name="email"
              placeholder="manager@cricmarket.com"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="password">
              Password
            </label>
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          {message && (
            <div className="rounded-lg bg-rose-500/10 p-3 text-center text-sm font-medium text-rose-400">
              {message}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3">
            <button
              formAction={signIn}
              className="w-full rounded-lg bg-zinc-100 px-4 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-300"
            >
              Sign In
            </button>
            <button
              formAction={signUp}
              className="w-full rounded-lg border border-zinc-700 bg-transparent px-4 py-3 font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              Create Franchise
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}