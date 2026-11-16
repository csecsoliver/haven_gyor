<script lang="ts">
  import '$lib/styles/landing.css';
  import type { LeaderboardEntry } from '$lib/schema';

  let { data }: { data: { leaderboard: LeaderboardEntry[] } } = $props();
  let showOfficialNotice = $state(true);
  const referral = 'https://haven.hack.club/150';
  // Only http(s) URLs become links; anything else is shown as plain text.
  const safeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : undefined);
  // Empty/whitespace-only fields render as a placeholder, never as empty cells.
  const orDash = (value: string) => (value.trim() ? value : '—');
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
    <a href={referral}>Sign up <span aria-hidden="true">↗</span></a>
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
      <a class="landing-signup" href={referral}>
        Sign up <span aria-hidden="true">↗</span>
      </a>
      <p class="landing-referral">Referral signup · <a href={referral}>haven.hack.club/150</a></p>
      <p class="landing-referral landing-instagram">
        Follow us on Instagram · <a href="https://www.instagram.com/haven.gyor.hackclub/">@haven.gyor.hackclub</a>
      </p>
      <p class="landing-disclaimer">
        Independent Haven Győr community website.<br />
        <strong>Not run by Hack Club HQ.</strong>
      </p>
    </div>
    <img class="landing-mascot" src="https://haven.hackclub.com/images/hedgehog.webp" alt="" aria-hidden="true" width="600" height="600" />
    <a class="landing-scroll" href="#leaderboard">
      See the leaderboard<span aria-hidden="true">↓</span>
    </a>
  </section>

  <section id="leaderboard" class="section leaderboard-section" aria-labelledby="leaderboard-title">
    <div class="section-heading">
      <p class="eyebrow">Project leaderboard</p>
      <h2 id="leaderboard-title">Leaderboard</h2>
      <p class="intro">Projects ranked by the community, loaded live from the database.</p>
    </div>
    {#if data.leaderboard.length}
      <table class="leaderboard">
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Project</th>
            <th scope="col">Authors</th>
            <th scope="col">Link</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {#each data.leaderboard as entry (entry.id)}
            {@const href = safeUrl(entry.url)}
            {@const sourceHref = safeUrl(entry.source_url)}
            <tr>
              <td class="rank">{entry.rank}</td>
              <td class="name">{orDash(entry.name)}</td>
              <td class="authors">
                {#if entry.authors.length}
                  {#each entry.authors as author, j}
                    {#if j > 0}, {/if}{orDash(author.name)}{#if author.email} <a class="email" href="mailto:{author.email}">{author.email}</a>{/if}
                  {/each}
                {:else}—{/if}
              </td>
              <td class="link">
                {#if href}
                  <a href={href} target="_blank" rel="noopener noreferrer">{entry.url}</a>
                {:else}
                  {orDash(entry.url)}
                {/if}
              </td>
              <td class="link">
                {#if sourceHref}
                  <a href={sourceHref} target="_blank" rel="noopener noreferrer">{entry.source_url}</a>
                {:else}
                  {orDash(entry.source_url)}
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="empty">No projects on the leaderboard yet.</p>
    {/if}
  </section>
</main>

<footer class="site-footer">
  <div class="footer-brand"><img src="https://haven.hackclub.com/images/haven-logo-color.webp" alt="Haven" loading="lazy" /><p>Made for curious people in Győr.</p></div>
  <div class="footer-copy"><p class="footer-disclaimer"><strong>Independent community website — not run by Hack Club HQ.</strong> All signup buttons use our referral link: <a href={referral}>https://haven.hack.club/150</a>.</p></div>
</footer>

<style>
  .leaderboard-section {
    max-width: 1120px;
  }
  .leaderboard {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: #fff9ea;
    border: 2px solid #c2a17b;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 6px 6px 0 #e3d5b9;
  }
  .leaderboard th,
  .leaderboard td {
    text-align: left;
    padding: 16px 20px;
  }
  .leaderboard thead th {
    font-family: 'Patrick Hand', cursive;
    font-weight: 400;
    font-size: 1.3rem;
    background: #f3e9d2;
    border-bottom: 2px solid #c2a17b;
  }
  .leaderboard tbody tr + tr td {
    border-top: 1px dashed #c9b695;
  }
  .rank {
    font-family: 'Patrick Hand', cursive;
    font-size: 1.4rem;
    color: var(--red);
    width: 90px;
  }
  .name {
    font-weight: 600;
  }
  .authors {
    color: #6b5847;
  }
  .link a {
    overflow-wrap: anywhere;
  }
  .empty {
    text-align: center;
    font-size: 1.1rem;
  }
  @media (max-width: 760px) {
    .leaderboard th,
    .leaderboard td {
      padding: 12px;
    }
  }
</style>
