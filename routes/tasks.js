const router = require("express").Router();
const { google } = require("googleapis");
const authenticateToken = require("../helpers/AuthenticateToken");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = process.env.SCOPES;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
router.get("/", authenticateToken, async (req, res) => {
  oauth2Client.setCredentials(req.user.tokens);

  const tasks = google.tasks({ version: "v1", auth: oauth2Client });

  try {
    // Get all task lists
    const tasklistsResponse = await tasks.tasklists.list();
    const tasklists = tasklistsResponse.data.items;

    // Get all tasks for each task list that are not shared with anyone
    const taskItems = [];
    for (let i = 0; i < tasklists.length; i++) {
      const tasklist = tasklists[i];
      const tasksResponse = await tasks.tasks.list({
        tasklist: tasklist.id,
      });
      const t = tasksResponse.data.items;

      // Filter out tasks that have any permissions set
      const unsharedTasks = t.filter((task) => {
        return !task.hasOwnProperty("shared") || task.shared === false;
      });

      taskItems.push(...unsharedTasks);
    }

    res.status(200).send({ tasklists, taskItems });
  } catch (error) {
    console.error(`Error getting tasks: ${error}`);
    res.status(500).send({
      message: "Internal server error",
    });
  }
});

router.patch("/:id", async (req, res) => {
  const tasks = google.tasks({
    version: "v1",
    auth: oauth2Client, // Replace with your access token
  });

  const taskId = req.params.id;
  const { completed } = req.body;

  try {
    // Build the request to update the task
    const request = {
      tasklist: "@default",
      task: taskId,
      resource: { status: completed ? "completed" : "needsAction" },
    };

    // Make the API request to update the task
    const response = await tasks.tasks.patch(request);

    // Return the updated task
    const updatedTask = response.data;
    res.json({ task: updatedTask });
  } catch (error) {
    console.error(`Error updating task: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  oauth2Client.setCredentials(req.user.tokens);

  const tasks = google.tasks({ version: "v1", auth: oauth2Client });

  const newTask = {
    title: req.body.title,
    notes: req.body.notes,
    tasklist: "@default",
  };

  try {
    const response = await tasks.tasks.insert({
      tasklist: "@default",
      requestBody: newTask,
    });
    console.log(`New task created with ID: ${response.data.id}`);

    if (req.body.sharedWith && Array.isArray(req.body.sharedWith)) {
      const taskListId = response.data.tasklist
        ? response.data.tasklist.split("/")[1]
        : null;

      // Search for the email addresses using the Gmail API
      const emailAddresses = await Promise.all(
        req.body.sharedWith.map(async (email) => {
          try {
            const result = await google
              .people({ version: "v1", auth: oauth2Client })
              .people.get({
                resourceName: `people/${email}`,
                personFields: "emailAddresses",
              });
            return result.data.emailAddresses[0].value;
          } catch (error) {
            console.error(
              `Error searching for email address: ${email}. ${error}`
            );
            return null;
          }
        })
      );

      // Filter out any null values from the array
      const filteredEmailAddresses = emailAddresses.filter(
        (emailAddress) => emailAddress !== null
      );

      // Add the email addresses as writers to the task
      const newPermissions = filteredEmailAddresses.map((emailAddress) => {
        return { role: "writer", emailAddress };
      });

      // Add permissions for each email address
      await Promise.all(
        newPermissions.map(async (permission) => {
          await tasks.tasks.update({
            tasklist: taskListId,
            task: response.data.id,
            requestBody: { ...permission, type: "user" },
          });
          console.log(`Task shared with user: ${permission.emailAddress}`);
        })
      );
    }

    res.status(201).send({
      message: "Task created successfully",
      taskId: response.data.id,
    });
  } catch (error) {
    console.error(`Error creating new task: ${error}`);
    res.status(500).send({
      message: "Internal server error",
    });
  }
});

router.get("/shared", authenticateToken, async (req, res) => {
  oauth2Client.setCredentials(req.user.tokens);

  const tasks = google.tasks({ version: "v1", auth: oauth2Client });

  try {
    // Get all task lists
    const tasklistsResponse = await tasks.tasklists.list();
    const tasklists = tasklistsResponse.data.items;

    // Get all tasks for each task list
    const sharedTasks = [];
    for (let i = 0; i < tasklists.length; i++) {
      const tasklist = tasklists[i];
      const tasksResponse = await tasks.tasks.list({
        tasklist: tasklist.id,
      });
      const t = tasksResponse.data.items;
      console.log("t", t);
      const sharedTasksInList = t.filter((task) => task.shared);
      sharedTasks.push(...sharedTasksInList);
    }

    res.status(200).send({ sharedTasks });
  } catch (error) {
    console.error(`Error getting shared tasks: ${error}`);
    res.status(500).send({
      message: "Internal server error",
    });
  }
});

module.exports = router;
