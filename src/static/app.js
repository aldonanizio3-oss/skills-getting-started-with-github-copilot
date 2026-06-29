document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activitiesData = {};

  function renderActivities(activities) {
    activitiesData = activities;

    // Clear loading message and previous options
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    // Populate activities list
    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      activityCard.dataset.activityName = name;

      const spotsLeft = details.max_participants - details.participants.length;
      const participantsMarkup = (details.participants || []).length
        ? (details.participants || [])
            .map(
              (participant) => `
                <li class="participant-row">
                  <span class="participant-email">${participant}</span>
                  <button
                    type="button"
                    class="participant-remove"
                    data-activity="${name}"
                    data-participant="${participant}"
                    aria-label="Remove ${participant}"
                    title="Unregister ${participant}"
                  >
                    ×
                  </button>
                </li>
              `
            )
            .join("")
        : '<li class="empty">Be the first to join!</li>';

      activityCard.innerHTML = `
        <div class="activity-card-header">
          <h4>${name}</h4>
          <span class="activity-badge">${spotsLeft} spots left</span>
        </div>
        <p class="activity-description">${details.description}</p>
        <div class="activity-meta">
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        </div>
        <div class="participants-section">
          <h5>Signed up participants</h5>
          <ul class="participants-list">${participantsMarkup}</ul>
        </div>
      `;

      activitiesList.appendChild(activityCard);

      activityCard.querySelectorAll(".participant-remove").forEach((button) => {
        button.addEventListener("click", async () => {
          const activityName = button.dataset.activity;
          const participant = button.dataset.participant;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(participant)}`,
              { method: "DELETE" }
            );
            const result = await response.json();

            if (response.ok) {
              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              await fetchActivities();
            } else {
              messageDiv.textContent = result.detail || "Unable to remove participant";
              messageDiv.className = "error";
            }

            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          } catch (error) {
            messageDiv.textContent = "Failed to remove participant.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
            console.error("Error removing participant:", error);
          }
        });
      });

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        if (activity in activitiesData) {
          activitiesData[activity] = {
            ...activitiesData[activity],
            participants: [...(activitiesData[activity].participants || []), email],
          };
          renderActivities(activitiesData);
        }

        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
