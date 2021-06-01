class ReleaseData {
  constructor(input) {
    if (!input instanceof Array) {
      throw new Error(`Expecting array to ReleaseData ctor input`);
    }
    this.versionData = new Map();
    for (const obj of input) {
      this.versionData[Object.keys(obj)[0]] = new VersionData(Object.values(obj)[0]);
    }
  }
}

class VersionData {
  constructor(input) {
    if (!input instanceof Array) {
      throw new Error('Expecting array to VersionData ctor input');
    }
    // Map gaurantees order of insertion
    this.changelogNotes = new Map();
    for (const obj of input) {
      this.changelogNotes[Object.keys(obj)[0]] = new ChangelogNotes(Object.values(obj)[0]);
    }
  }
}

class ChangelogNotes {
  constructor(input) {
    this.categories = input.Categories || {};
    this.extraNotes = input.ExtraNotes;
    this.headerSuffix = input.HeaderSuffix;
    this.createdAt = input.CreatedAt;
  }

  add(otherChangelogNotes) {
    for (const [header, notes] of Object.entries(otherChangelogNotes.categories)) {
      for (const note of notes) {
        if (!this.categories[header]) {
          this.categories[header] = [];
        }
        this.categories[header].push(note);
      }
    }
  }
}

class MarkdownRenderer {
  constructor(changelogJSON) {
    this.options = changelogJSON['Opts'];
    this.releaseData = new ReleaseData(changelogJSON['ReleaseData']);
  }
  render(obj, showOSNotes) {
    if (obj instanceof ChangelogNotes) {
      return this.renderChangelogNotes(obj, showOSNotes);
    }
    if (obj instanceof VersionData) {
      return this.renderVersionData(obj, showOSNotes);
    }
    if (obj instanceof ReleaseData) {
      return this.renderReleaseData(obj, showOSNotes);
    }
  }

  renderMarkdown(showOSNotes) {
    const renderer = new showdown.Converter({
      extensions: this.discludeHeaderAnchors ? []: ['header-anchors'],
      headerLevelStart: 3,
      prefixHeaderId: this.headerIdPrefix+HASH_SEPARATOR,
      simplifiedAutoLink: true,
    });
    const markdown = this.render(this.releaseData, showOSNotes);
    return renderer.makeHtml(markdown);
  }
}