document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('applicationForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageContainer = document.getElementById('messageContainer');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    // Set minimum date for start date input to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').setAttribute('min', today);

    // Handle file upload display
    const fileInput = document.getElementById('resume');
    const fileLabel = document.querySelector('label[for="resume"].file-upload-label');

    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const fileName = this.files[0].name;
            fileLabel.textContent = '📄 ' + fileName;
            fileLabel.style.background = 'linear-gradient(135deg, #8BAE3D 0%, #6F8E2A 100%)';
        } else {
            fileLabel.textContent = 'Choose File - Resume/CV';
            fileLabel.style.background = 'linear-gradient(135deg, #2A6BB0 0%, #1A5490 100%)';
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate file size
        const resumeFile = document.getElementById('resume').files[0];
        if (resumeFile && resumeFile.size > 5 * 1024 * 1024) {
            showError('Resume file size must be less than 5MB');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = 'Submitting...';

        try {
            // Collect form data
            const formData = await collectFormData();

            // Send to webhook
            const response = await fetch('https://n8n.srv946784.hstgr.cloud/webhook/Buildwise', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showSuccess();
                form.reset();
            } else {
                const errorData = await response.text();
                showError(`Server error: ${response.status} - ${errorData || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showError(`Failed to submit application: ${error.message}`);
        } finally {
            // Reset submit button
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = 'Submit Application';
        }
    });

    async function collectFormData() {
        // Get form elements
        const fullName = document.getElementById('fullName').value;
        const gender = document.getElementById('gender').value;
        const languages = document.getElementById('languages').value;
        const email = document.getElementById('email').value;
        const experienceYears = parseInt(document.getElementById('experienceYears').value);
        const driverLicense = document.getElementById('driverLicense').value || '';
        const startDate = document.getElementById('startDate').value;
        const noticePeriod = document.getElementById('noticePeriod').value;

        // Get industry experience
        const industryExperience = [];
        document.querySelectorAll('input[name="industryExperience"]:checked').forEach(checkbox => {
            industryExperience.push(checkbox.value);
        });

        // Get computer skills
        const computerSkills = [];
        document.querySelectorAll('input[name="computerSkills"]:checked').forEach(checkbox => {
            computerSkills.push(checkbox.value);
        });

        // Get personality traits
        const personality = {
            patient: false,
            assertive: false,
            casual: false
        };
        document.querySelectorAll('input[name="personality"]:checked').forEach(checkbox => {
            personality[checkbox.value] = true;
        });

        // Convert resume to base64
        const resumeFile = document.getElementById('resume').files[0];
        let resumeBase64 = '';
        if (resumeFile) {
            resumeBase64 = await fileToBase64(resumeFile);
        }

        // Build JSON object
        return {
            full_name: fullName,
            gender: gender,
            language: languages,
            email: email,
            experience_years: experienceYears,
            industry_experience: industryExperience,
            computer_skills: computerSkills,
            driver_license: driverLicense,
            resume_base64: resumeBase64,
            application_answers: {
                available_start: startDate,
                notice_period: noticePeriod
            },
            personality: personality
        };
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove data URL prefix and return only base64 string
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function showSuccess() {
        messageContainer.classList.remove('hidden');
        successMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');

        // Scroll to message
        messageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Hide success message after 5 seconds
        setTimeout(() => {
            successMessage.classList.add('hidden');
            messageContainer.classList.add('hidden');
        }, 5000);
    }

    function showError(message) {
        messageContainer.classList.remove('hidden');
        successMessage.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorText.textContent = message;

        // Scroll to message
        messageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Form validation enhancement
    const requiredInputs = form.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.style.borderColor = 'var(--buildwise-orange)';
            } else {
                this.style.borderColor = '';
            }
        });
    });
});