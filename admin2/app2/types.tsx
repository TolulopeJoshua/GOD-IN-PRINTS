export interface article {
    article: {
        _id: object,
        image: {key: string},
        name: string,
        role: string,
        source: string,
        story: string,
        isApproved: boolean,
        bin: {dropped: boolean}
    }
}

export interface biography {
    biography: {
        _id: object,
        image: {key: string},
        name: string,
        gender: string,
        role: string,
        birthYear: number,
        deathYear: number,
        source: string,
        story: string,
        isApproved: boolean,
        bin: {dropped: boolean}
    }
}

export interface book {
    book: {
        _id: object,
        image: {key: string},
        title: string,
        author: string,
        filetype: string,
        document: {key: string, size: number}
        isApproved: boolean,
        bin: {dropped: boolean}
    }
}