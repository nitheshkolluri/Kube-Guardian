export function detectPII(text: string): boolean {
    const piiPatterns = [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN
        /\b(?:\d{4}[-\s]?){3}\d{4}\b/, // Credit card
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/, // IP address
        /\b[A-Z]{2}\d{6,}\b/, // Passport-like
    ];

    return piiPatterns.some(pattern => pattern.test(text));
}

export function redactPII(text: string): string {
    let redacted = text;

    // Email
    redacted = redacted.replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        '[EMAIL_REDACTED]'
    );

    // Phone
    redacted = redacted.replace(
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        '[PHONE_REDACTED]'
    );

    // SSN
    redacted = redacted.replace(
        /\b\d{3}-\d{2}-\d{4}\b/g,
        '[SSN_REDACTED]'
    );

    // Credit card
    redacted = redacted.replace(
        /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        '[CARD_REDACTED]'
    );

    // IP address
    redacted = redacted.replace(
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        '[IP_REDACTED]'
    );

    // Passport-like
    redacted = redacted.replace(
        /\b[A-Z]{2}\d{6,}\b/g,
        '[ID_REDACTED]'
    );

    return redacted;
}

export function highlightPII(text: string): { text: string; isPII: boolean; type?: string }[] {
    const segments: { text: string; isPII: boolean; type?: string }[] = [];
    let lastIndex = 0;

    const patterns = [
        { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
        { regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'phone' },
        { regex: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'ssn' },
        { regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, type: 'card' },
        { regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, type: 'ip' },
    ];

    const matches: { index: number; length: number; type: string }[] = [];

    patterns.forEach(({ regex, type }) => {
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push({
                index: match.index,
                length: match[0].length,
                type,
            });
        }
    });

    matches.sort((a, b) => a.index - b.index);

    matches.forEach(match => {
        if (match.index > lastIndex) {
            segments.push({
                text: text.substring(lastIndex, match.index),
                isPII: false,
            });
        }
        segments.push({
            text: text.substring(match.index, match.index + match.length),
            isPII: true,
            type: match.type,
        });
        lastIndex = match.index + match.length;
    });

    if (lastIndex < text.length) {
        segments.push({
            text: text.substring(lastIndex),
            isPII: false,
        });
    }

    return segments.length > 0 ? segments : [{ text, isPII: false }];
}
