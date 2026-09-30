<script lang="ts">
  export let segments: { text: string; href?: string; mark?: boolean }[] = [];
  const safeLink = (href: string) => /^(https:\/\/|mailto:)/i.test(href) ? href : undefined;
</script>

{#each segments as segment}
  {#if segment.href && safeLink(segment.href)}
    <a href={safeLink(segment.href)}>{#if segment.mark}<mark>{segment.text}</mark>{:else}{segment.text}{/if}</a>
  {:else if segment.mark}
    <mark>{segment.text}</mark>
  {:else}
    {segment.text}
  {/if}
{/each}
