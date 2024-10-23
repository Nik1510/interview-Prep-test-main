let mediaRecorder;
let audioChunks = [];

// Function to fetch JSON data and handle non-JSON responses
async function fetchJSON(url) {
    try {
        const response = await fetch(url);

        // Check if the response is JSON
        const contentType = response.headers.get("content-type");
        console.log("Response Content-Type:", contentType); // Log the content type for debugging

        if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text(); // Log the actual response if it's non-JSON
            console.log("Non-JSON response body:", textResponse);
            throw new Error("Received non-JSON response.");
        }

        return await response.json(); // Parse the JSON response
    } catch (error) {
        console.error("Error fetching JSON data:", error);
        throw error; // Re-throw the error for handling outside
    }
}

// Event listener to get the question based on the selected domain
document.getElementById('getQuestion').onclick = async () => {
    const domain = document.getElementById('domain').value;
    if (!domain) {
        document.getElementById('question').innerText = "Please select a domain.";
        return;
    }

    try {
        console.log("Fetching question for domain:", domain);
        const result = await fetchJSON(`/get-question/${domain}`);
        const cleanedQuestion = result.question.replace(/[#*]/g, '').trim(); // Clean up the question
        document.getElementById('question').innerText = cleanedQuestion;
    } catch (error) {
        document.getElementById('question').innerText = "Error fetching question.";
    }
};

// Start recording audio
document.getElementById('startButton').onclick = async () => {
    try {
        console.log("Requesting audio stream from user...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = []; // Reset audio chunks at the start

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            console.log("Audio recording stopped, preparing to submit...");

            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.wav');

            try {
                console.log("Submitting audio data...");
                const response = await fetch('/submit-audio', {
                    method: 'POST',
                    body: formData
                });
            
                const contentType = response.headers.get("content-type");
                console.log("Response Content-Type:", contentType); // Log content type
            
                let result;
                
                if (contentType && contentType.includes("application/json")) {
                    // Handle JSON response
                    result = await response.json();
                    console.log("Received JSON response:", result);
                    document.getElementById('feedback').innerText = result.feedback || "No feedback available.";
                } else {
                    // Handle non-JSON response as plain text
                    result = await response.text();
                    console.log("Received non-JSON response:", result);
                    document.getElementById('feedback').innerText = result || "Non-JSON response received.";
                }
            
                console.log("Audio successfully submitted and feedback received."); // Success log
            } catch (error) {
                console.error("Error submitting audio:", error);
                document.getElementById('feedback').innerText = "Error submitting audio. Please try again.";
            }            
        };

        mediaRecorder.start();
        console.log("Audio is listening..."); // Log start of recording

        document.getElementById('stopButton').style.display = 'block';
        document.getElementById('startButton').style.display = 'none';
    } catch (error) {
        console.error('Error accessing audio devices:', error);
        document.getElementById('feedback').innerText = "Error accessing audio devices. Please check your permissions.";
    }
};

// Stop recording audio
document.getElementById('stopButton').onclick = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log("Audio recording stopped."); // Log stop of recording
    }

    // Reset the buttons for next use
    document.getElementById('stopButton').style.display = 'none';
    document.getElementById('startButton').style.display = 'block';
};
