import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/notes";
import NotesLib "../lib/notes";

mixin (notes : Map.Map<Nat, Types.Note>, nextNoteId : { var value : Nat }) {
  public shared ({ caller }) func createNote(title : Text, body : Text) : async Types.NoteView {
    let note = NotesLib.create(notes, nextNoteId, caller, title, body, Time.now());
    NotesLib.toView(note);
  };

  public shared ({ caller }) func updateNote(id : Nat, title : Text, body : Text) : async ?Types.NoteView {
    switch (NotesLib.update(notes, id, caller, title, body, Time.now())) {
      case (?note) { ?NotesLib.toView(note) };
      case null { null };
    };
  };

  public shared ({ caller }) func deleteNote(id : Nat) : async Bool {
    NotesLib.remove(notes, id, caller);
  };

  public shared ({ caller }) func setNotePinned(id : Nat, pinned : Bool) : async ?Types.NoteView {
    switch (NotesLib.setPinned(notes, id, caller, pinned)) {
      case (?note) { ?NotesLib.toView(note) };
      case null { null };
    };
  };

  public query ({ caller }) func getNote(id : Nat) : async ?Types.NoteView {
    switch (NotesLib.get(notes, id, caller)) {
      case (?note) { ?NotesLib.toView(note) };
      case null { null };
    };
  };

  public query ({ caller }) func listNotes(search : ?Text) : async [Types.NoteView] {
    NotesLib.list(notes, caller, search).map(func note = NotesLib.toView(note));
  };
};
