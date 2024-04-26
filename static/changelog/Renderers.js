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
    let extensions = [];
    if (!this.discludeHeaderAnchors) {
      extensions.push('header-anchors');
    }
    const renderer = new showdown.Converter({
      extensions: extensions,
      headerLevelStart: 3,
      prefixHeaderId: this.headerIdPrefix+HASH_SEPARATOR,
    });
    const markdown = this.render(this.releaseData, showOSNotes);
    return renderer.makeHtml(markdown);
  }
}

class ChronologicalRenderer extends MarkdownRenderer {
  constructor(data) {
    super(data);
    this.headerIdPrefix = CHRONOLOGICAL;
  }
  renderChangelogNotes(input, showOSNotes) {
    input.sort((a, b) => {
      return b[1].createdAt - a[1].createdAt;
    });
    let output = '';
    for (const [header, changelogNotes] of input) {
      output += H3(getGithubReleaseLink(header) + changelogNotes.headerSuffix);
      for (let [category, notes] of Object.entries(changelogNotes.categories)) {
        notes = notes.filter((note) => !note.FromDependentVersion || showOSNotes);
        if (notes.length > 0) {
          output += H4(category);
          for (const note of notes) {
            output += UnorderedListItem(Note(note));
          }
        }
      }
    }
    return output;
  }

  renderVersionData(input, showOSNotes) {
    const notes = [];
    for (const versionData of input) {
      for (const [version, data] of Object.entries(versionData.changelogNotes)) {
        notes.push([version, data]);
      }
    }
    const output = this.renderChangelogNotes(notes, showOSNotes);
    return output;
  }

  renderReleaseData(input, showOSNotes) {
    const notes = [];
    for (const [, version] of Object.entries(input.versionData)) {
      notes.push(version);
    }
    const output = this.renderVersionData(notes, showOSNotes);
    return output;
  }
}

class MinorReleaseRenderer extends MarkdownRenderer {
  constructor(data) {
    super(data);
    this.headerIdPrefix = MINOR_RELEASE;
  }

  renderChangelogNotes(input, showOSNotes) {
    let output = '';
    for (let [header, notes] of Object.entries(input.categories)) {
      notes = notes.filter((note) => !note.FromDependentVersion || showOSNotes);
      if (notes.length > 0) {
        output += H4(header);
        for (const note of notes) {
          output += UnorderedListItem(Note(note));
        }
      }
    }
    return output;
  }

  renderVersionData(input, showOSNotes) {
    let output = '';
    for (const [header, notes] of Object.entries(input.changelogNotes)) {
      output += H3(getGithubReleaseLink(header) + notes.headerSuffix);
      output += this.renderChangelogNotes(notes, showOSNotes);
    }
    return output;
  }

  renderReleaseData(input, showOSNotes) {
    let output = '';
    for (const [header, notes] of Object.entries(input.versionData)) {
      output += Collapsible(header, this.renderVersionData(notes, showOSNotes), open=true);
    }
    return output;
  }
}

class VersionComparer {
  constructor(data) {
    this.opts = data['Opts'];
    this.releaseData = new ReleaseData(data['ReleaseData']);
    this.headerIdPrefix = COMPARE_VERSIONS;
    this.discludeHeaders = ['Dependency Bumps', 'Pre-release'];
  }

  renderVersionData(input, showOSNotes) {
    const notes = [];
    for (const versionData of input) {
      for (const [version, data] of Object.entries(versionData.changelogNotes)) {
        notes.push([version, data]);
      }
    }
    const output = this.renderChangelogNotes(notes, showOSNotes);
    return output;
  }

  renderChangelogNotes(input, showOSNotes) {
    let output = '';
    const sortedByCategory = Object.entries(input.categories).sort((a, b) => a[0] > b[0]);
    for (let [header, notes] of sortedByCategory) {
      if (this.discludeHeaders.includes(header)) {
        continue;
      }
      let section = '';
      notes = notes.filter((note) => !note.FromDependentVersion || showOSNotes);
      if (notes.length > 0) {
        for (const note of notes) {
          section += UnorderedListItem(Note(note));
        }
        output += Collapsible(`${header} (${notes.length})`, section);
      }
    }
    return output;
  }

  markdownToHtml(markdown) {
    const renderer = new showdown.Converter({
      headerLevelStart: 3,
      prefixHeaderId: this.headerIdPrefix+HASH_SEPARATOR,
      extensions: []
    });
    return renderer.makeHtml(markdown);
  }

  calculateDiff(startingIndex, endingIndex) {
    const data = new Map();
    for (const [version, changelogNotes] of Object.entries(this.versions).slice(startingIndex, endingIndex)) {
      for (const [header, notes] of Object.entries(changelogNotes.categories).sort((a, b) => a[0] > b[0])) {
        if (!this.discludeHeaders.includes(header)) {
          for (const note of notes) {
            if (!data[header]) {
              data[header] = {};
            }
            if (!data[header][version]) {
              data[header][version] = [];
            }
            data[header][version].push(note);
          }
        }
      }
    }
    return data;
  }

  renderOutput(data) {
    let output = '';
    for (const [header, versionData] of Object.entries(data)) {
      let noteStr = '';
      let count = 0;
      for (let [version, notes] of Object.entries(versionData)) {
        notes = notes.filter((note) => !note.FromDependentVersion || showOpenSource);
        if (notes.length > 0) {
          noteStr += H4('Added in ' + getGithubReleaseLink(version, true));
          for (const note of notes) {
            noteStr += UnorderedListItem(Note(note));
            count += 1;
          }
        }
      }
      output += Collapsible(`${header} (${count})`, noteStr, true);
    }
    return output;
  }

  setHash(previousVersion, newVersion) {
    window.location.hash = `${COMPARE_VERSIONS}_${previousVersion}${newVersion ? `...${newVersion}` : ''}`;
  }

  onSelectChange() {
    const oldVersionIdx = this.oldVersionSelect.prop('selectedIndex');
    let newVersionIdx = this.newVersionSelect.prop('selectedIndex');

    const newVersion = this.newVersionSelect.val();
    this.newVersionSelect.empty();
    this.newVersionSelect.append($('<option>').attr('value', 'previousOnly').text('Left version Only'));
    Object.entries(this.versions).slice(0, oldVersionIdx).forEach(([k, v]) => this.newVersionSelect.append($('<option>').attr('value', k).text(k)));
    if (oldVersionIdx < newVersionIdx) {
      newVersionIdx = 0;
      this.newVersionSelect.val('previousOnly');
    } else {
      this.newVersionSelect.val(newVersion);
    }
    if (this.newVersionSelect.val() === 'previousOnly') {
      this.setHash(this.oldVersionSelect.val());
    } else {
      this.setHash(this.oldVersionSelect.val(), newVersion);
    }
    this.newVersionSelect.prop('disabled', oldVersionIdx === 0);
    const startingIndex = newVersionIdx === 0 ? oldVersionIdx : newVersionIdx - 1;
    const data = this.calculateDiff(startingIndex, oldVersionIdx + 1);
    const output = this.renderOutput(data);
    const divText = this.markdownToHtml(output);
    $('#solodocs-compareversionstextdiv').html(divText);
    return divText;
  }

  getVersionsFromHash() {
    const diffString = window.location.hash.split(HASH_SEPARATOR)[1];
    if (diffString) {
      return diffString.split('...');
    }
    return [];
  }

  renderMarkdown() {
    this.versions = new Map();
    for (const [, v] of Object.entries(this.releaseData.versionData)) {
      for (const [version, data] of Object.entries(v.changelogNotes)) {
        // Don't include betas, only include releases
        // if (version.includes('-')){
        //   continue;
        // }
        this.versions[version] = data;
      }
    }
    const parentDiv = $('<div />');
    const div = $('<div style="display:flex;width:20%;"/>');
    this.oldVersionSelect = $('<select style="margin-right: 30%"/>').change(this.onSelectChange.bind(this));
    this.newVersionSelect = $('<select/>').prop('disabled', true).change(this.onSelectChange.bind(this));
    this.newVersionSelect.append($('<option>').attr('value', 'previousOnly').text('Left version Only'));
    const versions = Object.entries(this.versions).map(([k]) => k);
    versions.forEach((k) => {
      this.oldVersionSelect.append($('<option>').attr('value', k).text(k));
      this.newVersionSelect.append($('<option>').attr('value', k).text(k));
    });

    const [previousVersion, newVersion] = this.getVersionsFromHash();
    if (previousVersion && previousVersion.length > 0 && versions.includes(previousVersion)) {
      this.oldVersionSelect.val(previousVersion);
    }
    if (newVersion && newVersion.length > 0 && versions.includes(newVersion)) {
      this.newVersionSelect.val(newVersion);
    }

    div.append(this.oldVersionSelect).append(this.newVersionSelect);
    const textDiv = $('<div id="compareversionstextdiv"/>').html(this.onSelectChange());
    parentDiv.append(div).append(textDiv);
    return parentDiv;
  }
}
