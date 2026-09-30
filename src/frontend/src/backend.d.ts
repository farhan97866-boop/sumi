import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface NoteView {
    id: bigint;
    title: string;
    body: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    pinned: boolean;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createNote(title: string, body: string): Promise<NoteView>;
    deleteNote(id: bigint): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getChineseLearned(): Promise<Array<string>>;
    getChineseProgress(): Promise<bigint>;
    getJapaneseLearned(setId: string): Promise<Array<string>>;
    getJapaneseProgress(setId: string): Promise<bigint>;
    getNote(id: bigint): Promise<NoteView | null>;
    isCallerAdmin(): Promise<boolean>;
    listNotes(search: string | null): Promise<Array<NoteView>>;
    markChineseLearned(character: string, learned: boolean): Promise<void>;
    markJapaneseLearned(setId: string, character: string, learned: boolean): Promise<void>;
    schema(): Promise<string>;
    setNotePinned(id: bigint, pinned: boolean): Promise<NoteView | null>;
    updateNote(id: bigint, title: string, body: string): Promise<NoteView | null>;
}
