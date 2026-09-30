import Common "common";

module {
  public type JapaneseProgress = {
    key : Text;
    owner : Common.UserId;
    setId : Text;
    character : Text;
    learned : Bool;
    updatedAt : Common.Timestamp;
  };
};
