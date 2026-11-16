<script lang="ts">
  import '$lib/styles/landing.css';
  import type { LeaderboardEntry } from '$lib/schema';

  let { data }: { data: { leaderboard: LeaderboardEntry[] } } = $props();
  let showOfficialNotice = $state(true);
  // Only http(s) URLs become links; anything else is shown as plain text.
  const safeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : undefined);
  // Empty/whitespace-only fields render as a placeholder, never as empty cells.
  const orDash = (value: string) => (value.trim() ? value : '—');
  // Only the top three placings are displayed.
  const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : 'rd'}`;
</script>

<svelte:head>
  <title>Leaderboard · Haven Győr</title>
  <meta name="description" content="The Győr project leaderboard." />
  <meta name="theme-color" content="#f7f0df" />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>
{#if showOfficialNotice}
  <aside class="official-notice" aria-label="Official website">
    <button type="button" aria-label="Dismiss official website notice" onclick={() => showOfficialNotice = false}>×</button>
    <strong>Looking for the official website?</strong>
    <p>This is an independent Győr community site.</p>
    <a href="https://haven.hackclub.com">Visit haven.hackclub.com <span aria-hidden="true">↗</span></a>
  </aside>
{/if}
<header class="landing-header">
  <nav aria-label="Main navigation">
    <a href="#leaderboard">Leaderboard</a>
  </nav>
</header>

<main id="main">
  <section class="landing-hero" aria-labelledby="hero-title">
    <div class="landing-content">
      <h1 id="hero-title" class="landing-title">
        <img src="https://haven.hackclub.com/images/logo.webp" alt="Hack Club Haven" width="762" height="491" fetchpriority="high" />
        <span class="landing-brand-cross" aria-label="with">×</span>
        <img class="landing-jedlik-logo"
          src="https://jedlik.eu/_next/image?url=https%3A%2F%2Fgyor-jedlik.cms.intezmeny.edir.hu%2Fuploads%2Fthumbnail_Jedlik_logo_2020_200_3c5beeccf8.png&w=256&q=90"
          alt="Jedlik venue logo"
        />
      </h1>
      <div class="landing-tagline"><p>The Győr project leaderboard</p></div>
      <a class="landing-scroll-cta" href="#leaderboard">
        See the leaderboard <span aria-hidden="true">↓</span>
      </a>
      <p class="landing-referral landing-instagram">
        Follow us on Instagram · <a href="https://www.instagram.com/haven.gyor.hackclub/">@haven.gyor.hackclub</a>
      </p>
    </div>
    <img class="landing-mascot" src="https://haven.hackclub.com/images/hedgehog.webp" alt="" aria-hidden="true" width="600" height="600" />
  </section>

  <section id="leaderboard" class="section leaderboard-section" aria-labelledby="leaderboard-title">
    <div class="section-heading">
      <p class="eyebrow">Project leaderboard</p>
      <h2 id="leaderboard-title">Leaderboard</h2>
    </div>
    {#if data.leaderboard.length}
      <div class="leaderboard-grid">
        {#each data.leaderboard as entry (entry.id)}
          {@const href = safeUrl(entry.url)}
          {@const sourceHref = safeUrl(entry.source_url)}
          <article class="card">
            {#if entry.rank <= 3}<span class="placing">{ordinal(entry.rank)}</span>{/if}
            <h3 class="name">{orDash(entry.name)}</h3>
            <p class="authors">
              {#if entry.authors.length}
                {#each entry.authors as author, j}
                  {#if j > 0}, {/if}{orDash(author.name)}{#if author.email} <a class="email" href="mailto:{author.email}">{author.email}</a>{/if}
                {/each}
              {:else}—{/if}
            </p>
            <div class="links">
              <p><span class="label">Link</span> {#if href}<a href={href} target="_blank" rel="noopener noreferrer">{entry.url}</a>{:else}{orDash(entry.url)}{/if}</p>
              <p><span class="label">Source</span> {#if sourceHref}<a href={sourceHref} target="_blank" rel="noopener noreferrer">{entry.source_url}</a>{:else}{orDash(entry.source_url)}{/if}</p>
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <p class="empty">No projects on the leaderboard yet.</p>
    {/if}
  </section>
</main>

<footer class="site-footer">
  <div class="footer-brand"><img src="https://haven.hackclub.com/images/haven-logo-color.webp" alt="Haven" loading="lazy" /><p>Made for curious people in Győr.</p></div>
  <div class="footer-copy"><p class="footer-disclaimer"><strong>Independent community website — not run by Hack Club HQ.</strong></p></div>
</footer>

<style>
  /* Scroll-down hint in place of the old signup button. */
  .landing-scroll-cta {
    display: inline-flex;
    align-items: center;
    gap: 1.5rem;
    margin-left: 1rem;
    padding: 0.9rem 1.8rem;
    border: 2px solid #ffe9b7;
    border-radius: 14px;
    background: #462b27e6;
    box-shadow: 0 4px 0 #2c1d19;
    color: #fff3c6;
    font-family: 'Jua Extras', 'Jua', sans-serif;
    font-size: 1.7rem;
    text-decoration: none;
    transition: transform 0.15s, background 0.15s;
  }
  .landing-scroll-cta:hover {
    transform: translateY(-2px);
    background: #462b27;
    color: white;
  }
  @media (max-width: 700px) {
    .landing-scroll-cta {
      margin-left: 0;
      padding: 0.85rem 1.5rem;
      font-size: 1.5rem;
    }
  }
  .leaderboard-section {
    max-width: 1120px;
  }
  /* Cards sit next to each other on wide screens and wrap on narrow ones. */
  .leaderboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 28px;
  }
  .card {
    position: relative;
    padding: 28px 24px 24px;
    background: #fff9ea;
    border: 2px solid #c2a17b;
    border-radius: 14px;
    box-shadow: 6px 6px 0 #e3d5b9;
  }
  .placing {
    position: absolute;
    top: -16px;
    left: -12px;
    padding: 4px 14px;
    background: var(--red);
    color: #fff8e9;
    border: 2px solid #8f2825;
    border-radius: 999px;
    box-shadow: 2px 3px 0 #792825;
    font-family: 'Patrick Hand', cursive;
    font-size: 1.2rem;
  }
  .name {
    font-family: 'Patrick Hand', cursive;
    font-weight: 400;
    font-size: 1.9rem;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .authors {
    margin-top: 8px;
    color: #6b5847;
  }
  .links {
    margin-top: 16px;
    display: grid;
    gap: 6px;
  }
  .links p {
    overflow-wrap: anywhere;
  }
  .label {
    margin-right: 6px;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #885c48;
  }
  .empty {
    text-align: center;
    font-size: 1.1rem;
  }
</style>
