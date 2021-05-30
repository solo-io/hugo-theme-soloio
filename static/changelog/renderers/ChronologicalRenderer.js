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