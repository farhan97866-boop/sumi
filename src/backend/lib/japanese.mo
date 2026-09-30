import Map "mo:core/Map";
import Types "../types/japanese";
import Common "../types/common";

module {
  public func key(owner : Common.UserId, setId : Text, character : Text) : Text {
    owner.toText() # "|" # setId # "|" # character;
  };

  public func mark(
    progress : Map.Map<Text, Types.JapaneseProgress>,
    owner : Common.UserId,
    setId : Text,
    character : Text,
    learned : Bool,
    now : Common.Timestamp,
  ) : () {
    let k = key(owner, setId, character);
    let entry : Types.JapaneseProgress = {
      key = k;
      owner;
      setId;
      character;
      learned;
      updatedAt = now;
    };
    progress.add(k, entry);
  };

  public func learnedCount(
    progress : Map.Map<Text, Types.JapaneseProgress>,
    owner : Common.UserId,
    setId : Text,
  ) : Nat {
    progress.values().filter(func p = p.owner == owner and p.setId == setId and p.learned).size();
  };

  public func learnedCharacters(
    progress : Map.Map<Text, Types.JapaneseProgress>,
    owner : Common.UserId,
    setId : Text,
  ) : [Text] {
    progress.values().filter(func p = p.owner == owner and p.setId == setId and p.learned).map(func p = p.character).toArray();
  };
};
