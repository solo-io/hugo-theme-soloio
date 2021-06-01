const changelogData = {data: undefined};
const changelogDataSetter = new Proxy(changelogData, {
  set: function(_, key, value) {
    if (key === 'data') {
      $('#solodocs-changelogdiv').html(value);
    }
    return true;
  },
});

const HASH_SEPARATOR = '_';
const MINOR_RELEASE = 'minorrelease';
const CHRONOLOGICAL = 'chronological';
const COMPARE_VERSIONS = 'compareversions';
/**
 * Renders the changelog type determined by the hash
 */
function evaluateHashAndRenderChangelog() {
  const hash = window.location.hash.substr(1);
  let changelogType = MINOR_RELEASE;
  let scrollIntoView = true;
  if (hash.split(HASH_SEPARATOR).length > 0) {
    switch (hash.split(HASH_SEPARATOR)[0]) {
      case COMPARE_VERSIONS:
        scrollIntoView = false;
      case CHRONOLOGICAL:
      case MINOR_RELEASE:
        changelogType = hash.split(HASH_SEPARATOR)[0];
        break;
    }
  }
  $(SELECT_BOX_ID).val(changelogType);
  changelogDataSetter.data = getRenderer(changelogType, changelogJsonData).renderMarkdown(showOpenSource);
  if (scrollIntoView && window.location.hash && document.querySelector(window.location.hash)) {
    document.querySelector(window.location.hash).scrollIntoView();
  }
}

const SELECT_BOX_ID = '#solodocs-select-type';
const SHOW_OPEN_SOURCE_CHECKBOX_ID = '#solodocs-showOpenSource';

// Globals used in renderers
let showOpenSource = true;
let changelogJsonData;

$(document).ready(() => {
  if (!changelogPath) {
    console.err('changelogPath must be defined');
  }
  fetch(changelogPath).then((response) => response.json()).then((json) => {
    changelogJsonData = json;
    evaluateHashAndRenderChangelog();
    window.onhashchange = evaluateHashAndRenderChangelog;

    $(SELECT_BOX_ID).change((e) => {
      window.location.hash = e.target.value;
    });

    $(SHOW_OPEN_SOURCE_CHECKBOX_ID).click(function() {
      showOpenSource = this.checked;
      evaluateHashAndRenderChangelog();
    });
  });
});

/*
 Returns the correct renderer based off the string passed in from the hash
*/
function getRenderer(type, data) {
  switch (type) {
    case CHRONOLOGICAL:
      return new ChronologicalRenderer(data);
    case MINOR_RELEASE:
      return new MinorReleaseRenderer(data);
    case COMPARE_VERSIONS:
      return new VersionComparer(data);
  }
}