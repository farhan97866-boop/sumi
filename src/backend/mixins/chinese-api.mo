import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/chinese";
import ChineseLib "../lib/chinese";

mixin (chineseProgress : Map.Map<Text, Types.ChineseProgress>) {
  public shared ({ caller }) func markChineseLearned(character : Text, learned : Bool) : async () {
    ChineseLib.mark(chineseProgress, caller, character, learned, Time.now());
  };

  public query ({ caller }) func getChineseProgress() : async Nat {
    ChineseLib.learnedCount(chineseProgress, caller);
  };

  public query ({ caller }) func getChineseLearned() : async [Text] {
    ChineseLib.learnedCharacters(chineseProgress, caller);
  };
};
