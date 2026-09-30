import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/japanese";
import JapaneseLib "../lib/japanese";

mixin (japaneseProgress : Map.Map<Text, Types.JapaneseProgress>) {
  public shared ({ caller }) func markJapaneseLearned(setId : Text, character : Text, learned : Bool) : async () {
    JapaneseLib.mark(japaneseProgress, caller, setId, character, learned, Time.now());
  };

  public query ({ caller }) func getJapaneseProgress(setId : Text) : async Nat {
    JapaneseLib.learnedCount(japaneseProgress, caller, setId);
  };

  public query ({ caller }) func getJapaneseLearned(setId : Text) : async [Text] {
    JapaneseLib.learnedCharacters(japaneseProgress, caller, setId);
  };
};
