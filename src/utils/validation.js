
/**
 * Strict Full Name Validation:
 * - Must be at least 4 characters
 */
export const validateFullName = (name) => {
    return (name || '').trim().length >= 4;
};

/**
 * Strict Phone Validation:
 * - Must start with 6, 7, 8, or 9
 * - Must be exactly 10 digits
 */
export const validatePhone = (phone) => {
    const cleanPhone = (phone || '').toString().replace(/\s+/g, '').replace(/^\+91/, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleanPhone);
};

/**
 * Strict Email Validation:
 * - local-part@domain.extension
 * - Max 320 chars total
 * - Local part: Max 64 chars, letters, numbers, !#$%&'*+-/=?^_{|}~`
 * - Local part dots: No start/end dots, no consecutive dots
 * - Domain: letters, numbers, hyphens
 * - Domain hyphens: No start/end hyphen
 * - TLD: 2-63 characters
 */
export const validateEmail = (email) => {
    if (!email || email.length > 320) return false;

    const [localPart, domainPart] = email.split('@');
    if (!localPart || !domainPart || email.split('@').length !== 2) return false;

    // Local Part checks
    if (localPart.length > 64) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    if (localPart.includes('..')) return false;

    const localRegex = /^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~]+(\.[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~]+)*$/;
    if (!localRegex.test(localPart)) return false;

    // Domain Part checks
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) return false; // Must have at least one dot for extension

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || tld.length > 63) return false;

    // Each domain segment
    const segmentRegex = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/;
    for (let i = 0; i < domainParts.length; i++) {
        if (!segmentRegex.test(domainParts[i])) return false;
    }

    // Prohibited characters check (extra safety)
    const forbidden = /[(),:;<>\[\]]/;
    if (forbidden.test(email)) return false;

    return true;
};
