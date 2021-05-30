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