import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";

module {
  type OldActor = {};

  type Note = {
    id : Nat;
    owner : Principal;
    title : Text;
    body : Text;
    pinned : Bool;
    createdAt : Int;
    updatedAt : Int;
  };

  type JapaneseProgress = {
    key : Text;
    owner : Principal;
    setId : Text;
    character : Text;
    learned : Bool;
    updatedAt : Int;
  };

  type ChineseProgress = {
    key : Text;
    owner : Principal;
    character : Text;
    learned : Bool;
    updatedAt : Int;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    notes : Map.Map<Nat, Note>;
    nextNoteId : { var value : Nat };
    japaneseProgress : Map.Map<Text, JapaneseProgress>;
    chineseProgress : Map.Map<Text, ChineseProgress>;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      notes = Map.empty();
      nextNoteId = { var value = 0 };
      japaneseProgress = Map.empty();
      chineseProgress = Map.empty();
    };
  };
};
