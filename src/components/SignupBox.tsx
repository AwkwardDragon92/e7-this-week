import { AjaxForm, inputCls } from "./AjaxForm";

export function SignupBox({ source = "home" }: { source?: string }) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-violet-600/25 to-fuchsia-600/10 p-5 ring-1 ring-violet-500/30">
      <h2 className="text-lg font-bold text-white">The Thursday email</h2>
      <p className="mt-1 text-sm text-zinc-300">New codes, the new banner, and a short should-you-pull take. Once a week, after maintenance.</p>
      <AjaxForm action="/api/subscribe" submitLabel="Sign me up" success="You're in. See you Thursday!" className="mt-3 sm:flex sm:items-end sm:gap-2" extra={{ source }}>
        <label className="block flex-1">
          <span className="sr-only">Email</span>
          <input name="email" type="email" required placeholder="you@email.com" className={inputCls} autoComplete="email" />
        </label>
      </AjaxForm>
    </section>
  );
}
