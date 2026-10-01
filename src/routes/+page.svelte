<script lang="ts">
  import RichText from '$lib/components/RichText.svelte';
  import '$lib/styles/landing.css';
  import type { SiteContent } from '$lib/schema';

  export let data: { content: SiteContent };
  $: content = data.content;
  let showOfficialNotice = true;
  const referral = 'https://haven.hack.club/150';
  const asset = (src: string) => src?.startsWith('/images/') ? `https://haven.hackclub.com${src}` : src;
  const safeLink = (href?: string) => href && /^(https:\/\/|mailto:)/i.test(href) ? href : undefined;
</script>

<svelte:head>
  <title>{content.meta.title}</title>
  <meta name="description" content={content.meta.description} />
  <meta property="og:title" content={content.meta.title} />
  <meta property="og:description" content={content.meta.description} />
  <meta property="og:image" content={asset(content.meta.image)} />
  <meta name="theme-color" content="#f7f0df" />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>
{#if showOfficialNotice}
  <aside class="official-notice" aria-label="Official website">
    <button type="button" aria-label="Dismiss official website notice" on:click={() => showOfficialNotice = false}>×</button>
    <strong>Looking for the official website?</strong>
    <p>This is an independent Győr community site.</p>
    <a href="https://haven.hackclub.com">Visit haven.hackclub.com <span aria-hidden="true">↗</span></a>
  </aside>
{/if}
<header class="landing-header">
  <nav aria-label="Main navigation">
    <a href={referral}>{content.nav.signup} <span aria-hidden="true">↗</span></a>
    <a href="#about">{content.nav.about}</a>
    {#if content.faq.items.length}<a href="#faq">{content.nav.faq}</a>{/if}
  </nav>
</header>

<main id="main">
  <section class="landing-hero" aria-labelledby="hero-title">
    <div class="landing-content">
      <h1 id="hero-title" class="landing-title">
        <img src={asset('/images/logo.webp')} alt="Hack Club Haven" width="762" height="491" fetchpriority="high" />
        <span>Győr</span>
      </h1>
      <div class="landing-tagline">{#each content.tagline as line}<p>{line}</p>{/each}</div>
      <a class="landing-signup" href={referral}>
        {content.hero.signup.button} <span aria-hidden="true">↗</span>
      </a>
      <p class="landing-referral">Referral signup · <a href={referral}>haven.hack.club/150</a></p>
      <p class="landing-disclaimer">
        Independent Haven Győr community website.<br />
        <strong>Not run by Hack Club HQ.</strong>
      </p>
    </div>
    <img class="landing-mascot" src={asset('/images/hedgehog.webp')} alt="" aria-hidden="true" width="600" height="600" />
    <a class="landing-scroll" href="#about">
      {content.hero.scrollLabel}<span aria-hidden="true">↓</span>
    </a>
  </section>

  <section id="about" class="section about">
    <div class="section-heading"><p class="eyebrow">Make something that’s yours</p><h2>{content.about.title}</h2><p class="intro">{content.about.body}</p></div>
    {#each content.about.perks as perk, i}
      <article class:reverse={perk.side === 'end'} class="perk">
        <div class="perk-copy"><span class="number">0{i + 1}</span><h3>{perk.title}</h3>{#each perk.blurb as line}<p>{line}</p>{/each}</div>
        <div class="photo-pair">{#each perk.photos as photo}
          <figure class="polaroid">
            {#if safeLink(photo.href)}<a href={safeLink(photo.href)}><img src={asset(photo.src)} alt={photo.alt} loading="lazy" /></a>{:else}<img src={asset(photo.src)} alt={photo.alt} loading="lazy" />{/if}
            {#if photo.caption}<figcaption>{photo.caption.title}<small>{photo.caption.author}</small></figcaption>{/if}
          </figure>
        {/each}</div>
      </article>
    {/each}
  </section>

  <section class="section pitch">
    <img class="mascot" src={asset('/images/pitch/excited-daven.webp')} alt="" loading="lazy" />
    <h2>{content.pitch.heading}</h2>
    <div class="pitch-items">{#each content.pitch.items as item}<p class="speech" class:align-end={item.align === 'end'}><RichText segments={item.body} /></p>{/each}</div>
  </section>

  <section class="section steps">
    <div class="section-heading"><p class="eyebrow">Your next adventure starts here</p><h2>{content.steps.heading}</h2><p>{content.steps.subheading}</p></div>
    <ol class="step-grid"><li><span>01</span><h3>Save your spot</h3><p>Follow our referral link to sign up for Haven.</p></li><li><span>02</span><h3>Bring your curiosity</h3><p>Come with an idea, a friend, or just yourself. Beginners belong here.</p></li><li><span>03</span><h3>Make a game together</h3><p>Learn, build, and share something you’re proud of.</p></li></ol>
    <a class="button" href={referral}>Sign up via our referral link ↗</a>
    {#if safeLink(content.steps.cta?.href)}<p class="guide-link"><a href={safeLink(content.steps.cta.href)}>{content.steps.cta.label}</a></p>{/if}
  </section>

  <section id="schedule" class="section schedule">
    <div class="section-heading"><p class="eyebrow">A weekend well spent</p><h2>{content.schedule.heading}</h2></div>
    {#if content.schedule.days.length}
    <div class="schedule-days">{#each content.schedule.days as day}<article class="schedule-day"><h3>{day.day}</h3><ol>{#each day.items as item}<li><time>{item.time}</time><div><h4>{item.title}</h4>{#if item.body}<p>{item.body}</p>{/if}</div></li>{/each}</ol></article>{/each}</div>
    {:else}
    <div class="section-heading"><h3>{content.schedule.tbd.title}</h3><p>{content.schedule.tbd.body}</p></div>
    {/if}
    <img class="schedule-sheep" src={asset('/images/schedule/sheep.webp')} alt="" loading="lazy" />
  </section>

  <section class="section past-events">
    <div class="section-heading">{#each content.pastEvents.heading as line, i}{#if i === 0}<h2>{line}</h2>{:else}<p class="intro">{line}</p>{/if}{/each}</div>
    <div class="event-grid">{#each content.pastEvents.items as event}<article class="event-card"><a href={safeLink(event.href)} aria-label={`Watch ${event.title}`}><img class="event-photo" class:bottom={event.position === 'object-bottom'} src={asset(event.image)} alt={event.alt} loading="lazy" />{#if event.play}<img class="play" src={asset(event.play)} alt="" loading="lazy" />{/if}</a><h3>{event.title}</h3><p>{event.caption}</p></article>{/each}</div>
  </section>

  {#if content.sponsors.items.length}
    <section class="section sponsors"><div class="section-heading"><h2>{content.sponsors.heading}</h2></div><div class="sponsor-grid">{#each content.sponsors.items as sponsor}<a href={safeLink(sponsor.href)}><img src={asset(sponsor.image)} alt={sponsor.name} loading="lazy" /></a>{/each}</div></section>
  {/if}

  {#if content.faq.items.length}
  <section id="faq" class="section faq">
    <div class="section-heading"><p class="eyebrow">Good questions, straight answers</p><h2>{content.faq.heading}</h2></div>
    <p class="referral-note">Answers adapted from the original Haven page. “We” refers to Haven Győr’s organizers.</p>
    <div class="faq-list">{#each content.faq.items as item}<details><summary>{item.q}<span aria-hidden="true">+</span></summary><div class="answer"><RichText segments={item.a} /></div></details>{/each}</div>
    <div class="final-cta"><h3>Your first game starts with a hello.</h3><a class="button" href={referral}>{content.faq.cta} ↗</a><p class="referral-note">This is a referral link to haven.hack.club/150.</p></div>
  </section>
  {/if}
</main>

<footer class="site-footer">
  <div class="footer-brand"><img src={asset('/images/haven-logo-color.webp')} alt="Haven" loading="lazy" /><p>Made for curious people in Győr.</p></div>
  <div class="footer-copy">{#each content.footer.body as paragraph}<p><RichText segments={paragraph} /></p>{/each}<p class="footer-disclaimer"><strong>Independent community website — not run by Hack Club HQ.</strong> All signup buttons use our referral link: <a href={referral}>https://haven.hack.club/150</a>.</p></div>
</footer>
