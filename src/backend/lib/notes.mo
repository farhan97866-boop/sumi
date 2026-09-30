import Map "mo:core/Map";
import Types "../types/notes";
import Common "../types/common";

module {
  public func toView(note : Types.Note) : Types.NoteView {
    {
      id = note.id;
      title = note.title;
      body = note.body;
      pinned = note.pinned;
      createdAt = note.createdAt;
      updatedAt = note.updatedAt;
    };
  };

  public func create(
    notes : Map.Map<Nat, Types.Note>,
    nextId : { var value : Nat },
    owner : Common.UserId,
    title : Text,
    body : Text,
    now : Common.Timestamp,
  ) : Types.Note {
    let id = nextId.value;
    nextId.value := id + 1;
    let note : Types.Note = {
      id;
      owner;
      title;
      body;
      pinned = false;
      createdAt = now;
      updatedAt = now;
    };
    notes.add(id, note);
    note;
  };

  public func update(
    notes : Map.Map<Nat, Types.Note>,
    id : Nat,
    owner : Common.UserId,
    title : Text,
    body : Text,
    now : Common.Timestamp,
  ) : ?Types.Note {
    switch (notes.get(id)) {
      case (?note) {
        if (note.owner != owner) {
          return null;
        };
        let updated : Types.Note = {
          id = note.id;
          owner = note.owner;
          title;
          body;
          pinned = note.pinned;
          createdAt = note.createdAt;
          updatedAt = now;
        };
        notes.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  public func remove(
    notes : Map.Map<Nat, Types.Note>,
    id : Nat,
    owner : Common.UserId,
  ) : Bool {
    switch (notes.get(id)) {
      case (?note) {
        if (note.owner != owner) {
          return false;
        };
        notes.remove(id);
        true;
      };
      case null { false };
    };
  };

  public func get(
    notes : Map.Map<Nat, Types.Note>,
    id : Nat,
    owner : Common.UserId,
  ) : ?Types.Note {
    switch (notes.get(id)) {
      case (?note) {
        if (note.owner == owner) { ?note } else { null };
      };
      case null { null };
    };
  };

  public func list(
    notes : Map.Map<Nat, Types.Note>,
    owner : Common.UserId,
    search : ?Text,
  ) : [Types.Note] {
    let term = switch (search) {
      case (?t) { ?t.toLower() };
      case null { null };
    };
    let owned = notes.values().filter(func note = note.owner == owner);
    let matched = switch (term) {
      case (?q) {
        owned.filter(func note = note.title.toLower().contains(#text q) or note.body.toLower().contains(#text q));
      };
      case null { owned };
    };
    matched.toArray().sort(func(a, b) {
      if (a.pinned != b.pinned) {
        if (a.pinned) { #less } else { #greater };
      } else if (a.updatedAt > b.updatedAt) {
        #less;
      } else if (a.updatedAt < b.updatedAt) {
        #greater;
      } else {
        #equal;
      };
    });
  };

  public func setPinned(
    notes : Map.Map<Nat, Types.Note>,
    id : Nat,
    owner : Common.UserId,
    pinned : Bool,
  ) : ?Types.Note {
    switch (notes.get(id)) {
      case (?note) {
        if (note.owner != owner) {
          return null;
        };
        let updated : Types.Note = {
          id = note.id;
          owner = note.owner;
          title = note.title;
          body = note.body;
          pinned;
          createdAt = note.createdAt;
          updatedAt = note.updatedAt;
        };
        notes.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };
};
