// utils/dateParser.js (Definitive Version)

function parseCunyDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) {
        return { success: false };
    }

    // --- NEW, BULLETPROOF DATE LOGIC ---
    // Create a date object directly from the string.
    // "August 14, 2025" is a format that the JS Date constructor handles reliably.
    const datePart = new Date(dateStr);
    
    // Check if the initial parsing was successful
    if (isNaN(datePart.getTime())) {
        console.error("Initial date string parsing failed for:", dateStr);
        return { success: false };
    }
    // --- END NEW LOGIC ---

    const timeParts = timeStr.toLowerCase().replace(/—/g, '-').split(' - ');
    
    const parseTimeComponent = (time) => {
        if (!time) return null;
        let [hours, minutes] = time.replace('am', '').replace('pm', '').trim().split(':').map(Number);
        minutes = minutes || 0;
        if (time.includes('pm') && hours < 12) hours += 12;
        if (time.includes('am') && hours === 12) hours = 0;
        return { hours, minutes };
    };
    
    const startT = parseTimeComponent(timeParts[0]);
    if (!startT) { // Handle "All Day" or unparseable time
        const start = new Date(datePart.setHours(9, 0, 0, 0));
        const end = new Date(datePart.setHours(17, 0, 0, 0));
        return { start, end, success: !isNaN(start) };
    }

    // Set the parsed time components onto our valid date object
    const start = new Date(datePart.setHours(startT.hours, startT.minutes, 0, 0));

    let end;
    const endT = timeParts.length > 1 ? parseTimeComponent(timeParts[1]) : null;
    if (endT) {
        end = new Date(datePart.setHours(endT.hours, endT.minutes, 0, 0));
    } else {
        end = new Date(start.getTime() + 60 * 60 * 1000); // Default to 1 hour
    }

    if (isNaN(start) || isNaN(end)) {
        console.error("Date construction failed after setting time for:", { dateStr, timeStr });
        return { success: false };
    }
    
    return { start, end, success: true };
}

module.exports = { parseCunyDateTime };