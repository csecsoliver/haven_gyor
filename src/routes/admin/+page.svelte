<script lang="ts">
  let token = $state('');
  let document = $state('{}');
  let busy = $state(false);
  let message = $state('');
  let failed = $state(false);

  async function responseError(response: Response) {
    try {
      const data = await response.json();
      return data.error ?? data.message ?? `Request failed (${response.status})`;
    } catch { return `Request failed (${response.status})`; }
  }

  async function importDocument() {
    if (!confirm('Replace all stored overrides with this document? Omitted fields will return to local defaults.')) return;
    busy = true;
    message = '';
    failed = false;
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: document
      });
      if (!response.ok) throw new Error(await responseError(response));
      message = 'Import saved. Reload the public page to see the current database state.';
    } catch (cause) {
      failed = true;
      message = cause instanceof Error ? cause.message : 'Import failed.';
    } finally { busy = false; }
  }

  async function exportDocument(resolved = false) {
    busy = true;
    message = '';
    failed = false;
    try {
      const response = await fetch(`/api/content${resolved ? '?resolved=1' : ''}`, {
        headers: { authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      if (!response.ok) throw new Error(await responseError(response));
      const json = await response.text();
      if (!resolved) document = json;
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const link = window.document.createElement('a');
      link.href = url;
      link.download = resolved ? 'haven-gyor-resolved.json' : 'haven-gyor.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      message = resolved ? 'Complete resolved content exported.' : 'Stored overrides exported and loaded into the editor.';
    } catch (cause) {
      failed = true;
      message = cause instanceof Error ? cause.message : 'Export failed.';
    } finally { busy = false; }
  }

  async function readFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 1_048_576) {
      failed = true;
      message = 'JSON must be at most 1 MiB.';
      return;
    }
    document = await file.text();
    message = 'File loaded into the editor. It has not been saved yet.';
    failed = false;
  }
</script>

<svelte:head>
  <title>Content admin · Independent Haven Győr</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="admin">
  <a href="/">← Back to the public page</a>
  <h1>Content import & export</h1>
  <p>This is an independently maintained site, not run by Hack Club HQ.</p>
  <p>
    Paste the Haven <a href="https://github.com/hackclub/haven/blob/main/SITE_DATA.md">SITE_DATA JSON</a>,
    or upload a file. Both <code>faq: […]</code> and <code>faq: &#123; items: […] &#125;</code>
    are accepted. Imports replace all overrides; omitted fields use local defaults.
    Empty arrays remove their items. The independence notice and referral URL stay fixed.
  </p>
  <label for="token">Admin token</label>
  <input id="token" type="password" bind:value={token} autocomplete="off" spellcheck="false" />
  <p class="hint">Kept only in this page’s memory; never stored in your browser. Use HTTPS in production.</p>
  <label for="upload">Upload JSON (maximum 1 MiB)</label>
  <input id="upload" type="file" accept=".json,application/json" onchange={readFile} disabled={busy} />
  <label for="json">JSON document</label>
  <textarea id="json" bind:value={document} spellcheck="false" rows="22" disabled={busy}></textarea>
  <div class="actions">
    <button onclick={importDocument} disabled={busy || !token}>Replace stored overrides</button>
    <button onclick={() => exportDocument()} disabled={busy || !token}>Export stored overrides</button>
    <button onclick={() => exportDocument(true)} disabled={busy || !token}>Export with defaults</button>
  </div>
  <p role="status" class:error={failed}>{busy ? 'Working…' : message}</p>
</main>

<style>
  .admin { max-width: 960px; margin: 3rem auto; padding: 1.5rem; }
  h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
  p { line-height: 1.6; }
  label { display: block; font-weight: bold; margin: 1.5rem 0 .5rem; }
  input, textarea { max-width: 100%; }
  input[type="password"], textarea { width: 100%; padding: .8rem; border: 2px solid #594532; border-radius: .5rem; background: #fffdf7; color: #30261e; }
  textarea { font: .9rem/1.5 monospace; }
  .hint { font-size: .9rem; }
  .actions { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 1rem; }
  button { background: #a9232f; color: white; border: 0; padding: .9rem 1.2rem; border-radius: .5rem; cursor: pointer; }
  button:disabled { opacity: .6; cursor: not-allowed; }
  .error { color: #a9232f; white-space: pre-wrap; }
</style>
