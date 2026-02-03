// ===== DOM Element Selection =====
// Getting references to all the HTML elements we'll need to interact with
const subjectsInput = document.getElementById('subjects');
const hoursPerDayInput = document.getElementById('hoursPerDay');
const daysLeftInput = document.getElementById('daysLeft');
const generateBtn = document.getElementById('generateBtn');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');
const scheduleOutput = document.getElementById('scheduleOutput');
const printBtn = document.getElementById('printBtn');
const resetBtn = document.getElementById('resetBtn');

// Summary display elements
const totalSubjectsSpan = document.getElementById('totalSubjects');
const totalHoursSpan = document.getElementById('totalHours');
const hoursPerSubjectSpan = document.getElementById('hoursPerSubject');
const studyDaysSpan = document.getElementById('studyDays');

// ===== Event Listeners =====
// Listen for button clicks
generateBtn.addEventListener('click', generateStudyPlan);
printBtn.addEventListener('click', printSchedule);
resetBtn.addEventListener('click', resetForm);

// Allow pressing Enter in input fields to generate plan
subjectsInput.addEventListener('keypress', handleEnterKey);
hoursPerDayInput.addEventListener('keypress', handleEnterKey);
daysLeftInput.addEventListener('keypress', handleEnterKey);

// ===== Main Function: Generate Study Plan =====
function generateStudyPlan() {
    // Step 1: Get input values
    const subjectsValue = subjectsInput.value.trim();
    const hoursPerDay = parseFloat(hoursPerDayInput.value);
    const daysLeft = parseInt(daysLeftInput.value);

    // Step 2: Validate inputs
    const validation = validateInputs(subjectsValue, hoursPerDay, daysLeft);
    if (!validation.isValid) {
        showError(validation.message);
        return;
    }

    // Step 3: Clear any previous errors
    hideError();

    // Step 4: Parse subjects into an array
    const subjects = parseSubjects(subjectsValue);

    // Step 5: Calculate the study plan
    const studyPlan = calculateStudyPlan(subjects, hoursPerDay, daysLeft);

    // Step 6: Display the results
    displayResults(studyPlan, subjects.length, hoursPerDay, daysLeft);
}

// ===== Input Validation =====
function validateInputs(subjects, hoursPerDay, daysLeft) {
    // Check if subjects field is empty
    if (!subjects) {
        return {
            isValid: false,
            message: '⚠️ Please enter at least one subject.'
        };
    }

    // Check if hours per day is provided and valid
    if (!hoursPerDay || hoursPerDay <= 0) {
        return {
            isValid: false,
            message: '⚠️ Please enter valid hours per day (greater than 0).'
        };
    }

    // Check if hours per day is reasonable (not more than 24)
    if (hoursPerDay > 24) {
        return {
            isValid: false,
            message: '⚠️ Hours per day cannot exceed 24 hours.'
        };
    }

    // Check if days left is provided and valid
    if (!daysLeft || daysLeft <= 0) {
        return {
            isValid: false,
            message: '⚠️ Please enter valid number of days (greater than 0).'
        };
    }

    // All validations passed
    return { isValid: true };
}

// ===== Parse Subjects from Input =====
function parseSubjects(subjectsString) {
    // Split by comma, trim whitespace, and filter out empty strings
    return subjectsString
        .split(',')
        .map(subject => subject.trim())
        .filter(subject => subject.length > 0);
}

// ===== Core Logic: Calculate Study Plan =====
function calculateStudyPlan(subjects, hoursPerDay, totalDays) {
    // Calculate total available study time
    const totalHours = hoursPerDay * totalDays;
    
    // Calculate equal time for each subject
    const hoursPerSubject = totalHours / subjects.length;
    
    // Initialize tracking for remaining hours per subject
    const remainingHours = {};
    subjects.forEach(subject => {
        remainingHours[subject] = hoursPerSubject;
    });

    // Create daily schedule
    const schedule = [];
    let subjectIndex = 0; // Track which subject to assign next

    // Loop through each day
    for (let day = 1; day <= totalDays; day++) {
        const dailySchedule = {
            day: day,
            subjects: [],
            totalHours: 0
        };

        let remainingDailyHours = hoursPerDay;

        // Fill the day with subjects until we run out of hours
        while (remainingDailyHours > 0) {
            // Get the current subject in rotation
            const currentSubject = subjects[subjectIndex % subjects.length];
            
            // Check if this subject still has hours left to allocate
            if (remainingHours[currentSubject] > 0) {
                // Determine how many hours to allocate
                // Use the minimum of: remaining daily hours, remaining subject hours, or 2 hours (reasonable study session)
                const hoursToAllocate = Math.min(
                    remainingDailyHours,
                    remainingHours[currentSubject],
                    2 // Max 2 hours per subject per session for better focus
                );

                // Add to daily schedule
                dailySchedule.subjects.push({
                    name: currentSubject,
                    hours: parseFloat(hoursToAllocate.toFixed(2))
                });

                // Update remaining hours
                remainingHours[currentSubject] -= hoursToAllocate;
                remainingDailyHours -= hoursToAllocate;
                dailySchedule.totalHours += hoursToAllocate;
            }

            // Move to next subject
            subjectIndex++;

            // Safety check: if all subjects are exhausted, break
            const allSubjectsExhausted = subjects.every(
                subject => remainingHours[subject] <= 0
            );
            if (allSubjectsExhausted) {
                break;
            }

            // Safety check: prevent infinite loop
            if (subjectIndex > subjects.length * totalDays * 10) {
                break;
            }
        }

        // Only add days that have subjects scheduled
        if (dailySchedule.subjects.length > 0) {
            dailySchedule.totalHours = parseFloat(dailySchedule.totalHours.toFixed(2));
            schedule.push(dailySchedule);
        }
    }

    return schedule;
}

// ===== Display Results =====
function displayResults(schedule, numSubjects, hoursPerDay, totalDays) {
    // Calculate summary statistics
    const totalHours = hoursPerDay * totalDays;
    const hoursPerSubject = totalHours / numSubjects;

    // Update summary card
    totalSubjectsSpan.textContent = numSubjects;
    totalHoursSpan.textContent = `${totalHours.toFixed(1)} hrs`;
    hoursPerSubjectSpan.textContent = `${hoursPerSubject.toFixed(1)} hrs`;
    studyDaysSpan.textContent = totalDays;

    // Clear previous schedule
    scheduleOutput.innerHTML = '';

    // Generate HTML for each day
    schedule.forEach(day => {
        const dayCard = createDayCard(day);
        scheduleOutput.appendChild(dayCard);
    });

    // Show results section with animation
    resultsSection.classList.remove('hidden');
    
    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== Create Day Card HTML Element =====
function createDayCard(dayData) {
    // Create main day card container
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';

    // Create day header
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';

    const dayTitle = document.createElement('div');
    dayTitle.className = 'day-title';
    dayTitle.textContent = `Day ${dayData.day}`;

    const dayTotal = document.createElement('div');
    dayTotal.className = 'day-total';
    dayTotal.textContent = `Total: ${dayData.totalHours} hrs`;

    dayHeader.appendChild(dayTitle);
    dayHeader.appendChild(dayTotal);

    // Create subject list
    const subjectList = document.createElement('div');
    subjectList.className = 'subject-list';

    dayData.subjects.forEach(subject => {
        const subjectItem = document.createElement('div');
        subjectItem.className = 'subject-item';

        const subjectName = document.createElement('div');
        subjectName.className = 'subject-name';
        subjectName.textContent = subject.name;

        const subjectDuration = document.createElement('div');
        subjectDuration.className = 'subject-duration';
        subjectDuration.textContent = `${subject.hours} ${subject.hours === 1 ? 'hour' : 'hours'}`;

        subjectItem.appendChild(subjectName);
        subjectItem.appendChild(subjectDuration);
        subjectList.appendChild(subjectItem);
    });

    // Assemble the card
    dayCard.appendChild(dayHeader);
    dayCard.appendChild(subjectList);

    return dayCard;
}

// ===== Error Handling Functions =====
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Hide error after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.classList.remove('show');
}

// ===== Utility Functions =====
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        generateStudyPlan();
    }
}

function printSchedule() {
    window.print();
}

function resetForm() {
    // Clear all inputs
    subjectsInput.value = '';
    hoursPerDayInput.value = '';
    daysLeftInput.value = '';
    
    // Hide results
    resultsSection.classList.add('hidden');
    
    // Clear any errors
    hideError();
    
    // Focus on first input
    subjectsInput.focus();
    
    // Smooth scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== EXTENSION IDEAS (for future development) =====
/*
 * 1. PRIORITY LEVELS:
 *    - Add difficulty/priority input for each subject
 *    - Allocate more time to difficult subjects
 * 
 * 2. BREAK TIMES:
 *    - Add automatic break periods (e.g., 10 min break after 50 min study)
 *    - Implement Pomodoro technique
 * 
 * 3. LOCAL STORAGE:
 *    - Save plans using localStorage
 *    - Allow users to view/edit previous plans
 * 
 * 4. EXPORT OPTIONS:
 *    - Export to PDF
 *    - Export to Google Calendar
 *    - Export to CSV
 * 
 * 5. SMART SCHEDULING:
 *    - Allow users to set preferred times for each subject
 *    - Consider optimal study times (morning vs evening)
 * 
 * 6. PROGRESS TRACKING:
 *    - Add checkboxes to mark completed sessions
 *    - Track overall progress
 *    - Show completion percentage
 * 
 * 7. CUSTOMIZATION:
 *    - Add themes (dark mode, light mode)
 *    - Custom color coding for subjects
 *    - Adjustable study session lengths
 * 
 * 8. REAL AI INTEGRATION:
 *    - Use Claude API to generate personalized study tips
 *    - Analyze study patterns and suggest improvements
 *    - Generate practice questions for each subject
 */