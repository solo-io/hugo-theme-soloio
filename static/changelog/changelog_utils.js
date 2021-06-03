/**
 * Copies anchor link to clipboard
 */
function copyAnchorToClipboard(elem) {
  str = window.location.href.split('#')[0] + '#' +elem.id;
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

// Extension for adding header anchor links to the markdown renderer
showdown.extension('header-anchors', function() {
  const ancTpl = '$1<a id="user-content-$3" onclick="copyAnchorToClipboard($3)" class="anchor" href="#$3" aria-hidden="true"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>$4';
  return [{
    type: 'html',
    regex: /(<h([1-5]) id="([^"]+?)">.*)(<\/h\2>)/g,
    replace: ancTpl,
  }];
});

// Extension for turning any string that matches the link regex (e.g. https://github.com/solo-io/gloo/commits/23423ab) to a link element
showdown.extension('auto-url', function() {
  const ancTpl = '$1<a id="user-content-$3" onclick="copyAnchorToClipboard($3)" class="anchor" href="#$3" aria-hidden="true"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>$4';
  return [{
    type: 'lang',
    regex: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g,
    replace: '[$1]($1)',
  }];
});

/**
 * Markdown functions  
 */
function H1(s) {
  return `\n# ${s}\n`;
}

function H2(s ) {
  return `\n## ${s}\n`;
}

function H3(s ) {
  return `\n### ${s}\n`;
}

function H4(s ) {
  return `\n#### ${s}\n`;
}

function H5(s ) {
  return `\n##### ${s}\n`;
}

function H5(s ) {
  return `\n###### ${s}\n`;
}

function Bold(s ) {
  return `**${s}**`;
}

function Italic(s ) {
  return `*${s}*`;
}

function OrderedListItem(s ) {
  return `1. ${s}\n`;
}

function UnorderedListItem(s) {
  return `- ${s}\n`;
}

function Link(title, link ) {
  return `[${title}](${link})`;
}

// Renderes a collapsible section, where content will only show if the title is expanded.
// open determines whether or not the section is expanded by default
function Collapsible(title, content, open=false) {
  return `\n<details ${open && 'open'}><summary >\n${title}</summary>\n${content}</details>\n `;
}

function Note(note) {
  let out = '';
  if (note.FromDependentVersion) {
    out += `(From OSS ${getGithubReleaseLink(note.FromDependentVersion, true)}) `;
  }
  out += `${note.Note}`;
  return out;
}
/**
 * Returns markdown link to github release for version
 * @param version the version of the release
 * @param useOtherRepo if true, uses the DependentRepo rather than MainRepo for the link.
 */
function getGithubReleaseLink(version, useOtherRepo) {
  const globalOpts = changelogJsonData.Opts;
  const repo = useOtherRepo ? globalOpts.DependentRepo : globalOpts.MainRepo;
  return `[${version}](https://github.com/${globalOpts.RepoOwner}/${repo}/releases/tag/${version})`;
}
