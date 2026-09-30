import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import IntValue "mo:caffeineai-oql/IntValue";
import NotesTypes "types/notes";
import JapaneseTypes "types/japanese";
import ChineseTypes "types/chinese";
import NotesApi "mixins/notes-api";
import JapaneseApi "mixins/japanese-api";
import ChineseApi "mixins/chinese-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let notes : Map.Map<Nat, NotesTypes.Note>;
  let nextNoteId : { var value : Nat };
  let japaneseProgress : Map.Map<Text, JapaneseTypes.JapaneseProgress>;
  let chineseProgress : Map.Map<Text, ChineseTypes.ChineseProgress>;

  transient let anyPrincipal = Principal.fromText("aaaaa-aa");

  include MixinAuthorization(accessControlState, null);
  include NotesApi(notes, nextNoteId);
  include JapaneseApi(japaneseProgress);
  include ChineseApi(chineseProgress);
  include ApiDocMixin();
  include Expose({
    entities = [
      notes.toEntity("note", "Note", "id")
        .sample({
          id = 0;
          owner = anyPrincipal;
          title = "";
          body = "";
          pinned = false;
          createdAt = 0;
          updatedAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      japaneseProgress.toEntity("japaneseProgress", "JapaneseProgress", "key")
        .sample({
          key = "";
          owner = anyPrincipal;
          setId = "";
          character = "";
          learned = false;
          updatedAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      chineseProgress.toEntity("chineseProgress", "ChineseProgress", "key")
        .sample({
          key = "";
          owner = anyPrincipal;
          character = "";
          learned = false;
          updatedAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
