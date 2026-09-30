import Common "common";

module {
  public type Note = {
    id : Nat;
    owner : Common.UserId;
    title : Text;
    body : Text;
    pinned : Bool;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  public type NoteView = {
    id : Nat;
    title : Text;
    body : Text;
    pinned : Bool;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };
};
