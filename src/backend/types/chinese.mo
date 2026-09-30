import Common "common";

module {
  public type ChineseProgress = {
    key : Text;
    owner : Common.UserId;
    character : Text;
    learned : Bool;
    updatedAt : Common.Timestamp;
  };
};
