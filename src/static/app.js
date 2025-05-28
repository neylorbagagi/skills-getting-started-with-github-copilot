document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  /**
   * Fetches activity data from the server and updates the UI with activity cards and participant lists.
   *
   * Retrieves activities from the `/activities` API endpoint, clears any loading messages, and dynamically generates activity cards displaying details and participants. Populates the activity selection dropdown with available activities. On failure, displays an error message in the activities list.
   */
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Cria a lista de participantes (bonita)
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participantes:</strong>
              <ul class="participants-list" style="list-style-type: none; padding-left: 0;">
                ${details.participants.map(email => `
                  <li style="display: flex; align-items: center; gap: 8px;">
                    <span>${email}</span>
                    <button class="delete-participant" data-activity="${name}" data-email="${email}" title="Remover participante" style="background: none; border: none; color: #c62828; cursor: pointer; font-size: 18px;">🗑️</button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participantes:</strong>
              <span class="no-participants">Nenhum participante ainda.</span>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
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

  // Adiciona event listeners para os botões de exclusão
  activitiesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-participant')) {
      const btn = e.target;
      const activity = btn.getAttribute('data-activity');
      const email = btn.getAttribute('data-email');
      if (confirm(`Remover ${email} de ${activity}?`)) {
        fetch(`/activities/${encodeURIComponent(activity)}/remove?email=${encodeURIComponent(email)}`, {
          method: 'DELETE',
        })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            messageDiv.textContent = result.message;
            messageDiv.className = "success";
            fetchActivities();
          } else {
            messageDiv.textContent = result.detail || "Erro ao remover participante.";
            messageDiv.className = "error";
          }
          messageDiv.classList.remove("hidden");
          setTimeout(() => messageDiv.classList.add("hidden"), 5000);
        })
        .catch(error => {
          messageDiv.textContent = "Erro ao remover participante.";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
          console.error("Error removing participant:", error);
        });
      }
    }
  });
});
