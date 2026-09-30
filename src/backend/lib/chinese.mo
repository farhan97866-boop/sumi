import Map "mo:core/Map";
import Types "../types/chinese";
import Common "../types/common";

module {
  public func key(owner : Common.UserId, character : Text) : Text {
    owner.toText() # "|" # character;
  };

  public func mark(
    progress : Map.Map<Text, Types.ChineseProgress>,
    owner : Common.UserId,
    character : Text,
    learned : Bool,
    now : Common.Timestamp,
  ) : () {
    let k = key(owner, character);
    let entry : Types.ChineseProgress = {
      key = k;
      owner;
      character;
      learned;
      updatedAt = now;
    };
    progress.add(k, entry);
  };

  public func learnedCount(
    progress : Map.Map<Text, Types.ChineseProgress>,
    owner : Common.UserId,
  ) : Nat {
    progress.values().filter(func p = p.owner == owner and p.learned).size();
  };

  public func learnedCharacters(
    progress : Map.Map<Text, Types.ChineseProgress>,
    owner : Common.UserId,
  ) : [Text] {
    progress.values().filter(func p = p.owner == owner and p.learned).map(func p = p.character).toArray();
  };
};
