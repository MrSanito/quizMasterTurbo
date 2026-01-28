import { prisma } from "../db/dist/client.js";

async function main() {
  console.log("🚀 Seeding Advanced Tech & Coding Category...");

  const shuffleAndFormat = (qText, opts, correctIdx) => {
    const correctValue = opts[correctIdx];
    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    const newCorrectIdx = shuffled.indexOf(correctValue);

    return {
      questionText: qText,
       points: 4 ,
      negativePoints: -1,
      Option: {
        create: shuffled.map((opt, i) => ({
          text: opt,
          isCorrect: i === newCorrectIdx,
        })),
      },
    };
  };

  const techData = [
    {
      quizNumber: 1,
      title: "Programming Languages Deep Dive",
      questions: [
        // 🟢 EASY
        [
          "Which language is mainly used in browsers?",
          ["Python", "Java", "JavaScript", "Go"],
          2,
          "EASY",
        ],
        [
          "Which language is known for indentation-based syntax?",
          ["C++", "Python", "Java", "PHP"],
          1,
          "EASY",
        ],
        [
          "Which language is used in Flutter?",
          ["Dart", "Swift", "Kotlin", "Rust"],
          0,
          "EASY",
        ],
        ["Which language runs on JVM?", ["Java", "C", "Go", "Ruby"], 0, "EASY"],
        [
          "Which is dynamically typed?",
          ["C#", "TypeScript", "Python", "Rust"],
          2,
          "EASY",
        ],

        // 🟡 MEDIUM
        [
          "Why is C considered faster than Python?",
          [
            "Less syntax",
            "Compiled to machine code",
            "Uses GPU",
            "Cloud based",
          ],
          1,
          "MEDIUM",
        ],
        [
          "What problem does TypeScript solve?",
          [
            "Adds database",
            "Adds static typing",
            "Runs faster",
            "Replaces JS engine",
          ],
          1,
          "MEDIUM",
        ],
        [
          "Why is Rust memory safe?",
          ["Garbage collector", "Ownership system", "VM usage", "Interpreter"],
          1,
          "MEDIUM",
        ],
        [
          "Why is Java platform independent?",
          ["Bytecode on JVM", "Open source", "Compiled twice", "Cloud hosted"],
          0,
          "MEDIUM",
        ],
        [
          "Which feature allows Python to handle async tasks?",
          ["Threads only", "GIL", "async/await", "Compiler"],
          2,
          "MEDIUM",
        ],

        // 🔴 HARD
        [
          "What happens when a C program accesses freed memory?",
          ["Nothing", "Memory leak", "Undefined behavior", "Compilation error"],
          2,
          "HARD",
        ],
        [
          "Why can JavaScript handle closures?",
          ["Stack memory", "Lexical scope", "Global variables", "Browser API"],
          1,
          "HARD",
        ],
        [
          "Which causes Python GIL bottleneck?",
          ["Memory", "Thread execution lock", "Disk IO", "Compiler"],
          1,
          "HARD",
        ],
        [
          "Why are pure functions preferred in functional languages?",
          ["Faster CPU", "No side effects", "Less RAM", "More threads"],
          1,
          "HARD",
        ],
        [
          "What issue does Go's goroutine scheduler solve?",
          [
            "Memory leaks",
            "Manual threading",
            "Efficient concurrency",
            "Compilation speed",
          ],
          2,
          "HARD",
        ],
      ],
    },

    {
      quizNumber: 2,
      title: "Web Development Concepts",
      questions: [
        // 🟢 EASY
        [
          "What does HTML structure?",
          ["Logic", "Style", "Content", "Database"],
          2,
          "EASY",
        ],
        [
          "CSS is mainly for?",
          ["Backend", "Design", "Security", "Storage"],
          1,
          "EASY",
        ],
        [
          "Which protocol loads websites?",
          ["FTP", "HTTP", "SMTP", "SSH"],
          1,
          "EASY",
        ],
        [
          "Which tag loads JS?",
          ["<js>", "<script>", "<code>", "<link>"],
          1,
          "EASY",
        ],
        [
          "Which status code means success?",
          ["404", "500", "200", "302"],
          2,
          "EASY",
        ],

        // 🟡 MEDIUM
        [
          "Why use semantic HTML?",
          [
            "SEO & accessibility",
            "Faster loading",
            "Better CSS",
            "More colors",
          ],
          0,
          "MEDIUM",
        ],
        [
          "Why is HTTPS secure?",
          ["Faster", "Encrypted via TLS", "Private IP", "Browser cache"],
          1,
          "MEDIUM",
        ],
        [
          "Why use CDN?",
          ["Storage", "Reduce latency", "Security", "Backend logic"],
          1,
          "MEDIUM",
        ],
        [
          "What problem does REST solve?",
          ["Database", "Standard communication", "Design", "CSS"],
          1,
          "MEDIUM",
        ],
        [
          "Why use caching?",
          [
            "Reduce server load",
            "Increase bugs",
            "More security",
            "Extra storage",
          ],
          0,
          "MEDIUM",
        ],

        // 🔴 HARD
        [
          "What happens if event loop is blocked in JS?",
          ["Faster UI", "UI freezes", "Memory leak", "Recompile"],
          1,
          "HARD",
        ],
        [
          "Why are WebSockets used?",
          [
            "Static files",
            "Real-time communication",
            "Database access",
            "Routing",
          ],
          1,
          "HARD",
        ],
        [
          "What issue does CORS prevent?",
          [
            "DB attack",
            "Cross-site requests abuse",
            "Cache overflow",
            "Memory leak",
          ],
          1,
          "HARD",
        ],
        [
          "Why debounce user input in search bars?",
          ["Security", "Reduce API calls", "UI colors", "Storage"],
          1,
          "HARD",
        ],
        [
          "What happens without indexing DB search columns?",
          ["More memory", "Slower queries", "Faster writes", "Crash"],
          1,
          "HARD",
        ],
      ],
    },

    // 👉 You repeat same pattern for remaining quizzes
    {
      quizNumber: 3,
      title: "Databases & Data Engineering",
      questions: [
        // EASY
        [
          "Which database is document-based?",
          ["MySQL", "MongoDB", "Postgres", "SQLite"],
          1,
          "EASY",
        ],
        [
          "SQL is mainly used to?",
          ["Design UI", "Query data", "Style pages", "Send emails"],
          1,
          "EASY",
        ],
        [
          "Primary key must be?",
          ["Unique", "Null", "Text", "Optional"],
          0,
          "EASY",
        ],
        [
          "Which command inserts data?",
          ["SELECT", "UPDATE", "INSERT", "DROP"],
          2,
          "EASY",
        ],
        [
          "Which DB is relational?",
          ["MongoDB", "Redis", "PostgreSQL", "Cassandra"],
          2,
          "EASY",
        ],

        // MEDIUM
        [
          "Why normalize a database?",
          ["Reduce redundancy", "Increase duplicates", "Speed CSS", "Security"],
          0,
          "MEDIUM",
        ],
        [
          "What problem do indexes solve?",
          ["Memory leak", "Slow searches", "Data loss", "Backup"],
          1,
          "MEDIUM",
        ],
        [
          "What does ACID ensure?",
          [
            "UI consistency",
            "Transaction reliability",
            "Server speed",
            "Encryption",
          ],
          1,
          "MEDIUM",
        ],
        [
          "Why use foreign keys?",
          ["Link tables", "Increase storage", "Encrypt DB", "Delete rows"],
          0,
          "MEDIUM",
        ],
        [
          "When is NoSQL preferred?",
          [
            "Fixed schema",
            "Large unstructured data",
            "Small tables",
            "Only numbers",
          ],
          1,
          "MEDIUM",
        ],

        // HARD
        [
          "What happens without transaction rollback?",
          ["Auto fix", "Data inconsistency", "Faster DB", "No effect"],
          1,
          "HARD",
        ],
        [
          "Why are joins expensive on large tables?",
          ["Too much RAM", "Scanning rows", "CSS load", "Index delete"],
          1,
          "HARD",
        ],
        [
          "What issue does sharding solve?",
          ["UI lag", "Scaling large DB", "Syntax errors", "Authentication"],
          1,
          "HARD",
        ],
        [
          "Which causes deadlocks?",
          ["Multiple transactions waiting", "Fast CPU", "Cache", "Low RAM"],
          0,
          "HARD",
        ],
        [
          "Why avoid SELECT * in production?",
          ["More typing", "Performance cost", "Syntax issue", "Security rule"],
          1,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 4,
      title: "Networking & Internet Logic",
      questions: [
        // EASY
        [
          "What does IP identify?",
          ["Device on network", "User", "File", "Website design"],
          0,
          "EASY",
        ],
        [
          "Which protocol loads webpages?",
          ["FTP", "SMTP", "HTTP", "SSH"],
          2,
          "EASY",
        ],
        [
          "Wi-Fi uses which signal?",
          ["Radio waves", "Laser", "Wired", "Bluetooth"],
          0,
          "EASY",
        ],
        ["Port 443 is for?", ["HTTP", "HTTPS", "FTP", "SSH"], 1, "EASY"],
        [
          "DNS converts domain to?",
          ["IP address", "MAC", "File", "Port"],
          0,
          "EASY",
        ],

        // MEDIUM
        [
          "Why is TCP reliable?",
          ["Encryption", "Packet acknowledgment", "Faster", "No routing"],
          1,
          "MEDIUM",
        ],
        [
          "Why use UDP for gaming?",
          ["Reliable", "Low latency", "Encrypted", "Large packets"],
          1,
          "MEDIUM",
        ],
        [
          "What problem does NAT solve?",
          ["IP shortage", "Speed", "UI", "DNS"],
          0,
          "MEDIUM",
        ],
        [
          "Why use load balancers?",
          ["Backup", "Distribute traffic", "Security", "Design"],
          1,
          "MEDIUM",
        ],
        [
          "What does ping test?",
          ["Storage", "Connectivity", "Security", "Database"],
          1,
          "MEDIUM",
        ],

        // HARD
        [
          "What happens if DNS server fails?",
          ["Faster net", "Cannot resolve domains", "IP lost", "Server crash"],
          1,
          "HARD",
        ],
        [
          "Why do packets get fragmented?",
          ["Large size", "Encryption", "Slow router", "Firewall"],
          0,
          "HARD",
        ],
        [
          "Which layer handles routing?",
          ["Transport", "Network", "Session", "Application"],
          1,
          "HARD",
        ],
        [
          "What issue does HTTPS prevent?",
          [
            "Packet loss",
            "Man-in-the-middle attack",
            "DNS failure",
            "Cache miss",
          ],
          1,
          "HARD",
        ],
        [
          "Why is latency critical for video calls?",
          ["Color quality", "Real-time sync", "File size", "Security"],
          1,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 5,
      title: "Cybersecurity & Threats",
      questions: [
        // EASY
        [
          "Phishing attacks use?",
          ["Fake emails", "Hardware", "Viruses only", "Firewalls"],
          0,
          "EASY",
        ],
        [
          "Firewall protects?",
          ["Network", "Keyboard", "Screen", "Battery"],
          0,
          "EASY",
        ],
        [
          "2FA improves?",
          ["Design", "Authentication", "Speed", "Memory"],
          1,
          "EASY",
        ],
        [
          "Malware means?",
          ["Malicious software", "Game", "Driver", "Update"],
          0,
          "EASY",
        ],
        ["VPN hides?", ["IP address", "Battery", "RAM", "Disk"], 0, "EASY"],

        // MEDIUM
        [
          "Why use HTTPS?",
          ["Encryption", "Speed", "Design", "Storage"],
          0,
          "MEDIUM",
        ],
        [
          "What does SQL injection exploit?",
          ["Input validation", "Hardware", "Cache", "Routing"],
          0,
          "MEDIUM",
        ],
        [
          "Why update software regularly?",
          ["New UI", "Patch vulnerabilities", "More ads", "Storage"],
          1,
          "MEDIUM",
        ],
        [
          "What is brute force attack?",
          ["Password guessing", "Virus", "Hardware damage", "Spam"],
          0,
          "MEDIUM",
        ],
        [
          "What is social engineering?",
          ["Manipulating humans", "Coding", "Database", "Encryption"],
          0,
          "MEDIUM",
        ],

        // HARD
        [
          "What happens in DDoS attack?",
          ["Server overloaded", "Data stolen", "DB deleted", "Firewall crash"],
          0,
          "HARD",
        ],
        [
          "Why is hashing used for passwords?",
          ["Faster login", "Hide real password", "Backup", "Sorting"],
          1,
          "HARD",
        ],
        [
          "Zero-day vulnerability means?",
          ["Unknown flaw", "Old bug", "Database issue", "Hardware error"],
          0,
          "HARD",
        ],
        [
          "What is privilege escalation?",
          ["Gain higher access", "Delete DB", "Encrypt files", "Phishing"],
          0,
          "HARD",
        ],
        [
          "Why use least privilege principle?",
          ["More control", "Reduce damage risk", "Faster app", "Less code"],
          1,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 6,
      title: "Operating Systems & Internals",
      questions: [
        [
          "OS manages?",
          ["Hardware & software", "Only UI", "Only CPU", "Only RAM"],
          0,
          "EASY",
        ],
        ["Linux is?", ["OS kernel", "Browser", "Database", "App"], 0, "EASY"],
        [
          "RAM is?",
          ["Temporary memory", "Permanent", "Storage", "GPU"],
          0,
          "EASY",
        ],
        [
          "Which schedules processes?",
          ["Kernel", "Browser", "DB", "Compiler"],
          0,
          "EASY",
        ],
        [
          "File system stores?",
          ["Files", "Passwords", "Apps", "RAM"],
          0,
          "EASY",
        ],

        [
          "Why use virtual memory?",
          ["Extend RAM", "Security", "Speed only", "GPU"],
          0,
          "MEDIUM",
        ],
        [
          "What is a process?",
          ["Running program", "CPU", "File", "Thread only"],
          0,
          "MEDIUM",
        ],
        [
          "What problem do threads solve?",
          ["Parallel tasks", "Storage", "UI", "Network"],
          0,
          "MEDIUM",
        ],
        [
          "What causes deadlock?",
          ["Circular wait", "Cache", "Firewall", "Compiler"],
          0,
          "MEDIUM",
        ],
        [
          "Why use permissions?",
          ["Security", "Speed", "Design", "Storage"],
          0,
          "MEDIUM",
        ],

        [
          "What happens in context switching?",
          [
            "CPU switches process",
            "Memory crash",
            "Disk clear",
            "Network drop",
          ],
          0,
          "HARD",
        ],
        [
          "Why are interrupts important?",
          ["Handle events", "Speed", "Design", "DB"],
          0,
          "HARD",
        ],
        [
          "Kernel panic means?",
          ["Critical OS failure", "UI crash", "Low RAM", "Virus"],
          0,
          "HARD",
        ],
        [
          "What does swapping cause?",
          ["Disk usage for RAM", "Faster CPU", "Better graphics", "Security"],
          0,
          "HARD",
        ],
        [
          "Race condition occurs when?",
          ["Concurrent access issue", "Slow net", "Memory full", "Cache miss"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 7,
      title: "AI & Machine Learning Concepts",
      questions: [
        [
          "AI mimics?",
          ["Human intelligence", "Hardware", "Networking", "DB"],
          0,
          "EASY",
        ],
        ["ML is subset of?", ["AI", "DB", "OS", "Cloud"], 0, "EASY"],
        [
          "Dataset used for training?",
          ["Training data", "CSS", "RAM", "GPU"],
          0,
          "EASY",
        ],
        ["Model learns from?", ["Data", "HTML", "RAM", "Disk"], 0, "EASY"],
        ["Chatbots use?", ["NLP", "GPU only", "CSS", "SQL"], 0, "EASY"],

        [
          "Overfitting means?",
          ["Too specific model", "Too fast", "Too secure", "Too big"],
          0,
          "MEDIUM",
        ],
        [
          "Why use validation data?",
          ["Check performance", "Design", "Security", "Storage"],
          0,
          "MEDIUM",
        ],
        [
          "What is supervised learning?",
          ["Labeled data training", "Random learning", "No data", "Hardware"],
          0,
          "MEDIUM",
        ],
        [
          "Why use GPUs in ML?",
          ["Parallel processing", "Design", "Storage", "Security"],
          0,
          "MEDIUM",
        ],
        [
          "Bias in AI means?",
          ["Skewed results", "Faster model", "Secure data", "Better UI"],
          0,
          "MEDIUM",
        ],

        [
          "Gradient descent optimizes?",
          ["Loss function", "Memory", "UI", "Storage"],
          0,
          "HARD",
        ],
        [
          "What is neural network inspired by?",
          ["Human brain", "CPU", "Internet", "OS"],
          0,
          "HARD",
        ],
        [
          "Vanishing gradient problem affects?",
          ["Deep networks", "Small apps", "CSS", "DB"],
          0,
          "HARD",
        ],
        [
          "Why use regularization?",
          ["Prevent overfitting", "Speed", "Security", "Design"],
          0,
          "HARD",
        ],
        [
          "Reinforcement learning uses?",
          ["Rewards & penalties", "Labels", "SQL", "Files"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 8,
      title: "Cloud & DevOps Engineering",
      questions: [
        [
          "Cloud means?",
          ["Remote servers", "Local PC", "RAM", "USB"],
          0,
          "EASY",
        ],
        [
          "Docker creates?",
          ["Containers", "VM only", "Database", "Network"],
          0,
          "EASY",
        ],
        ["AWS is?", ["Cloud provider", "OS", "Language", "IDE"], 0, "EASY"],
        ["CI/CD automates?", ["Build & deploy", "UI", "DB", "RAM"], 0, "EASY"],
        [
          "VM stands for?",
          ["Virtual Machine", "Visual Memory", "Video Mode", "None"],
          0,
          "EASY",
        ],

        [
          "Why use containers?",
          ["Consistency", "Design", "Faster internet", "Less code"],
          0,
          "MEDIUM",
        ],
        [
          "Kubernetes manages?",
          ["Containers at scale", "CSS", "DB", "UI"],
          0,
          "MEDIUM",
        ],
        [
          "What problem does autoscaling solve?",
          ["Traffic spikes", "Security", "Design", "Storage"],
          0,
          "MEDIUM",
        ],
        [
          "Why use monitoring tools?",
          ["Detect issues", "Faster UI", "More RAM", "Design"],
          0,
          "MEDIUM",
        ],
        [
          "What is Infrastructure as Code?",
          ["Automate infra setup", "Hardware", "UI", "DB"],
          0,
          "MEDIUM",
        ],

        [
          "What happens if deployment fails mid-way?",
          ["Rollback needed", "Auto success", "DB delete", "UI crash"],
          0,
          "HARD",
        ],
        [
          "Blue-green deployment helps?",
          ["Zero downtime", "More bugs", "Security", "Cache"],
          0,
          "HARD",
        ],
        [
          "What issue does logging solve?",
          ["Debugging production", "UI design", "Security", "CSS"],
          0,
          "HARD",
        ],
        [
          "Why use load balancers in cloud?",
          ["Distribute traffic", "Encrypt", "Design", "Store files"],
          0,
          "HARD",
        ],
        [
          "Immutable infrastructure means?",
          ["Replace not modify", "Delete DB", "Change RAM", "Manual config"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 9,
      title: "Git & Version Control Internals",
      questions: [
        [
          "Git is?",
          ["Distributed VCS", "Database", "IDE", "Compiler"],
          0,
          "EASY",
        ],
        [
          "git clone does?",
          ["Copies repo", "Deletes repo", "Uploads code", "Merges code"],
          0,
          "EASY",
        ],
        [
          "Branch is?",
          ["Parallel version", "Bug", "Server", "Folder"],
          0,
          "EASY",
        ],
        [
          "git commit saves to?",
          ["Local repo", "GitHub directly", "Server RAM", "Cloud DB"],
          0,
          "EASY",
        ],
        [
          "git pull means?",
          ["Fetch + merge", "Push", "Delete", "Rename"],
          0,
          "EASY",
        ],

        [
          "Why use branches?",
          ["Parallel development", "Speed CPU", "Security", "Storage"],
          0,
          "MEDIUM",
        ],
        [
          "What problem does merge solve?",
          ["Combine work", "Delete bugs", "Speed app", "Encrypt code"],
          0,
          "MEDIUM",
        ],
        [
          "What is a rebase?",
          ["Rewrite commit history", "Delete repo", "Push code", "Backup"],
          0,
          "MEDIUM",
        ],
        [
          "Why use .gitignore?",
          ["Ignore unnecessary files", "Security", "DB storage", "UI"],
          0,
          "MEDIUM",
        ],
        [
          "What is conflict in Git?",
          [
            "Same code edited differently",
            "Server crash",
            "DB fail",
            "Slow net",
          ],
          0,
          "MEDIUM",
        ],

        [
          "HEAD in Git points to?",
          ["Current commit", "First commit", "Remote repo", "Branch list"],
          0,
          "HARD",
        ],
        [
          "Detached HEAD state means?",
          ["Not on branch", "Repo deleted", "Server lost", "Conflict"],
          0,
          "HARD",
        ],
        [
          "Cherry-pick does?",
          ["Copy specific commit", "Merge all", "Delete commit", "Rebase repo"],
          0,
          "HARD",
        ],
        [
          "Staging area is?",
          ["Pre-commit zone", "Cloud", "Server", "Backup"],
          0,
          "HARD",
        ],
        [
          "Force push risk?",
          ["Overwrite history", "Speed up code", "Encrypt repo", "Backup"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 10,
      title: "DSA & Problem Solving",
      questions: [
        ["Stack follows?", ["LIFO", "FIFO", "Random", "Sorted"], 0, "EASY"],
        ["Queue follows?", ["FIFO", "LIFO", "Random", "Sorted"], 0, "EASY"],
        [
          "Binary search works on?",
          ["Sorted data", "Any data", "Graph", "Tree"],
          0,
          "EASY",
        ],
        [
          "Array access time?",
          ["O(1)", "O(n)", "O(log n)", "O(n²)"],
          0,
          "EASY",
        ],
        [
          "HashMap stores?",
          ["Key-value", "Sorted list", "Graph", "Stack"],
          0,
          "EASY",
        ],

        [
          "Why is quicksort fast average?",
          ["Divide & conquer", "Less memory", "Parallel", "Cache"],
          0,
          "MEDIUM",
        ],
        [
          "Linked list advantage?",
          ["Dynamic size", "Faster search", "Less memory always", "Sorting"],
          0,
          "MEDIUM",
        ],
        ["Recursion uses?", ["Call stack", "Heap", "Disk", "GPU"], 0, "MEDIUM"],
        [
          "Tree traversal BFS uses?",
          ["Queue", "Stack", "Array", "Hash"],
          0,
          "MEDIUM",
        ],
        ["DFS uses?", ["Stack", "Queue", "DB", "RAM"], 0, "MEDIUM"],

        [
          "Why is hash collision bad?",
          ["Slower lookup", "Memory leak", "Crash", "Sorting issue"],
          0,
          "HARD",
        ],
        [
          "Dynamic programming optimizes?",
          ["Overlapping subproblems", "Memory", "CPU speed", "Cache"],
          0,
          "HARD",
        ],
        [
          "Time complexity of merge sort?",
          ["O(n log n)", "O(n)", "O(n²)", "O(1)"],
          0,
          "HARD",
        ],
        [
          "Heap is used for?",
          ["Priority queue", "Stack", "List", "Hash"],
          0,
          "HARD",
        ],
        [
          "Graph cycle detection uses?",
          ["DFS", "BFS only", "Array", "Stack"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 11,
      title: "JavaScript Internals",
      questions: [
        [
          "JS runs on?",
          ["Browser & Node", "Only browser", "Only server", "OS"],
          0,
          "EASY",
        ],
        [
          "typeof null is?",
          ["object", "null", "undefined", "number"],
          0,
          "EASY",
        ],
        [
          "let vs var difference?",
          ["Block scope", "No diff", "Faster", "Memory"],
          0,
          "EASY",
        ],
        ["Promise handles?", ["Async tasks", "UI", "DB", "Storage"], 0, "EASY"],
        [
          "NaN means?",
          ["Not a Number", "Null", "Undefined", "Zero"],
          0,
          "EASY",
        ],

        [
          "Event loop handles?",
          ["Async execution", "UI only", "DB", "RAM"],
          0,
          "MEDIUM",
        ],
        [
          "Why closures work?",
          ["Lexical scope", "Stack", "Heap", "API"],
          0,
          "MEDIUM",
        ],
        [
          "Hoisting moves?",
          [
            "Declarations up",
            "Functions down",
            "Variables delete",
            "Code reorder",
          ],
          0,
          "MEDIUM",
        ],
        [
          "Why use debounce?",
          ["Reduce calls", "Increase UI", "Security", "Storage"],
          0,
          "MEDIUM",
        ],
        [
          "this depends on?",
          ["Call context", "Function name", "Scope", "Browser"],
          0,
          "MEDIUM",
        ],

        [
          "Memory leak occurs when?",
          ["Unused references kept", "Fast CPU", "Async call", "Cache"],
          0,
          "HARD",
        ],
        [
          "Microtasks include?",
          ["Promises", "setTimeout", "DOM", "CSS"],
          0,
          "HARD",
        ],
        [
          "Call stack overflow due to?",
          ["Infinite recursion", "Async calls", "Large array", "Loop"],
          0,
          "HARD",
        ],
        [
          "Garbage collector frees?",
          ["Unreachable memory", "Used memory", "Cache", "Disk"],
          0,
          "HARD",
        ],
        [
          "Prototype chain used for?",
          ["Inheritance", "Security", "Speed", "Parsing"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 12,
      title: "React & Frontend Systems",
      questions: [
        ["React is?", ["UI library", "Language", "DB", "Server"], 0, "EASY"],
        ["useState manages?", ["State", "Routing", "CSS", "API"], 0, "EASY"],
        ["Component returns?", ["JSX", "HTML file", "JSON", "CSS"], 0, "EASY"],
        [
          "Props are?",
          ["Inputs to component", "State", "Hooks", "CSS"],
          0,
          "EASY",
        ],
        [
          "Virtual DOM improves?",
          ["Performance", "Security", "Storage", "Memory"],
          0,
          "EASY",
        ],

        [
          "Why keys in lists?",
          ["Efficient diffing", "Security", "CSS", "API"],
          0,
          "MEDIUM",
        ],
        [
          "useEffect used for?",
          ["Side effects", "State only", "UI", "Routing"],
          0,
          "MEDIUM",
        ],
        [
          "Why memoization?",
          ["Avoid re-render", "Security", "DB", "Network"],
          0,
          "MEDIUM",
        ],
        [
          "Controlled input means?",
          ["State-driven", "DOM-driven", "Static", "Server"],
          0,
          "MEDIUM",
        ],
        ["Context solves?", ["Prop drilling", "CSS", "API", "DB"], 0, "MEDIUM"],

        [
          "Reconciliation means?",
          ["DOM diffing", "Routing", "Security", "Cache"],
          0,
          "HARD",
        ],
        [
          "Why avoid anonymous functions in render?",
          ["Re-render issues", "Syntax", "Security", "CSS"],
          0,
          "HARD",
        ],
        [
          "Hydration in SSR?",
          ["Attach JS to HTML", "DB load", "CSS load", "Cache"],
          0,
          "HARD",
        ],
        [
          "StrictMode helps?",
          ["Detect issues", "Speed", "Security", "Memory"],
          0,
          "HARD",
        ],
        [
          "Concurrent rendering allows?",
          ["Interruptible rendering", "Faster DB", "Better CSS", "Storage"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 13,
      title: "System Design Foundations",
      questions: [
        [
          "Scalability means?",
          ["Handle growth", "Security", "UI", "Speed"],
          0,
          "EASY",
        ],
        [
          "Database replica used for?",
          ["Read scaling", "Write speed", "Security", "UI"],
          0,
          "EASY",
        ],
        [
          "Cache stores?",
          ["Temporary data", "Permanent", "CSS", "Logs"],
          0,
          "EASY",
        ],
        [
          "CDN helps?",
          ["Faster content delivery", "Security", "Storage", "DB"],
          0,
          "EASY",
        ],
        [
          "Load balancer does?",
          ["Traffic distribution", "Encryption", "Cache", "Storage"],
          0,
          "EASY",
        ],

        ["Why partition DB?", ["Scale", "UI", "Security", "CSS"], 0, "MEDIUM"],
        [
          "What problem does rate limiting solve?",
          ["Abuse control", "Speed", "UI", "Storage"],
          0,
          "MEDIUM",
        ],
        [
          "Why use message queues?",
          ["Async tasks", "UI", "CSS", "Security"],
          0,
          "MEDIUM",
        ],
        [
          "CAP theorem deals with?",
          ["Consistency/Availability/Partition", "Speed", "Security", "UI"],
          0,
          "MEDIUM",
        ],
        [
          "Horizontal scaling means?",
          ["Add machines", "Upgrade CPU", "More RAM", "Cache"],
          0,
          "MEDIUM",
        ],

        [
          "Eventual consistency means?",
          ["Delay in sync", "Crash", "Loss", "Instant"],
          0,
          "HARD",
        ],
        [
          "Thundering herd problem?",
          ["Many requests at once", "Cache", "CSS", "DB"],
          0,
          "HARD",
        ],
        [
          "Hotspot in DB means?",
          ["Uneven traffic", "Crash", "Security", "Slow UI"],
          0,
          "HARD",
        ],
        [
          "Idempotent API means?",
          ["Same result repeated", "Fast API", "Secure API", "UI API"],
          0,
          "HARD",
        ],
        [
          "Backpressure controls?",
          ["System overload", "CSS", "DB delete", "Routing"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 14,
      title: "Software Testing & Reliability",
      questions: [
        [
          "Unit testing checks?",
          ["Smallest code parts", "Whole system", "UI", "DB"],
          0,
          "EASY",
        ],
        [
          "Bug means?",
          ["Error in code", "Feature", "Update", "Tool"],
          0,
          "EASY",
        ],
        [
          "Automation testing uses?",
          ["Tools/scripts", "Humans only", "Servers", "DB"],
          0,
          "EASY",
        ],
        [
          "Regression testing ensures?",
          ["Old features still work", "Speed", "Security", "UI"],
          0,
          "EASY",
        ],
        [
          "QA stands for?",
          ["Quality Assurance", "Quick App", "Query Access", "None"],
          0,
          "EASY",
        ],

        [
          "Why write test cases?",
          ["Prevent future bugs", "Speed CPU", "Security only", "UI"],
          0,
          "MEDIUM",
        ],
        [
          "Mocking helps?",
          ["Simulate dependencies", "UI", "DB", "Security"],
          0,
          "MEDIUM",
        ],
        [
          "Load testing checks?",
          ["Performance under stress", "UI design", "Security", "DB schema"],
          0,
          "MEDIUM",
        ],
        [
          "CI ensures?",
          ["Frequent integration", "UI speed", "DB scaling", "CSS"],
          0,
          "MEDIUM",
        ],
        [
          "TDD starts with?",
          ["Writing test first", "Deploying", "Designing UI", "DB"],
          0,
          "MEDIUM",
        ],

        [
          "Flaky test means?",
          ["Unreliable result", "Fast test", "Secure", "Slow"],
          0,
          "HARD",
        ],
        [
          "Test coverage measures?",
          ["Code tested %", "Speed", "Security", "DB"],
          0,
          "HARD",
        ],
        [
          "Race conditions often caught in?",
          ["Concurrency tests", "UI tests", "Unit only", "Manual"],
          0,
          "HARD",
        ],
        [
          "Can 100% coverage mean bug-free?",
          ["No", "Yes", "Always", "Guaranteed"],
          0,
          "HARD",
        ],
        [
          "Chaos testing introduces?",
          ["Failures intentionally", "Security", "UI", "Cache"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 15,
      title: "DevOps & Infrastructure",
      questions: [
        [
          "CI/CD means?",
          [
            "Continuous integration & deployment",
            "Coding interface",
            "Cloud infra",
            "None",
          ],
          0,
          "EASY",
        ],
        [
          "Docker isolates?",
          ["App environments", "DB only", "CPU", "UI"],
          0,
          "EASY",
        ],
        ["Kubernetes manages?", ["Containers", "UI", "CSS", "JS"], 0, "EASY"],
        [
          "Terraform is for?",
          ["Infra as code", "Testing", "Security", "UI"],
          0,
          "EASY",
        ],
        [
          "Monitoring tracks?",
          ["System health", "UI", "Design", "Storage"],
          0,
          "EASY",
        ],

        [
          "Why use containers?",
          ["Consistency", "Security only", "UI", "Speed internet"],
          0,
          "MEDIUM",
        ],
        [
          "Blue-green deploy helps?",
          ["Zero downtime", "Speed CPU", "Security", "Storage"],
          0,
          "MEDIUM",
        ],
        [
          "Logs are important for?",
          ["Debugging", "UI", "Security only", "CSS"],
          0,
          "MEDIUM",
        ],
        [
          "Autoscaling responds to?",
          ["Traffic load", "UI", "Design", "CSS"],
          0,
          "MEDIUM",
        ],
        [
          "Infra as code benefits?",
          ["Reproducibility", "UI", "Speed", "Cache"],
          0,
          "MEDIUM",
        ],

        [
          "Single point of failure means?",
          ["System risk", "Fast app", "UI crash", "Security bug"],
          0,
          "HARD",
        ],
        [
          "Circuit breaker pattern prevents?",
          ["Cascading failures", "Security", "UI lag", "Memory"],
          0,
          "HARD",
        ],
        [
          "Immutable infra principle?",
          ["Replace not modify", "Edit servers", "Manual patch", "DB edit"],
          0,
          "HARD",
        ],
        [
          "Observability includes?",
          ["Logs, metrics, traces", "UI", "Cache", "CSS"],
          0,
          "HARD",
        ],
        [
          "Rolling deploy means?",
          ["Gradual update", "Instant crash", "Delete server", "Reset DB"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 16,
      title: "AI & Emerging Technologies",
      questions: [
        [
          "AI aims to mimic?",
          ["Human intelligence", "RAM", "GPU", "Internet"],
          0,
          "EASY",
        ],
        ["ML model learns from?", ["Data", "CSS", "HTML", "RAM"], 0, "EASY"],
        [
          "NLP works with?",
          ["Text & language", "Images", "Hardware", "DB"],
          0,
          "EASY",
        ],
        [
          "ChatGPT is?",
          ["Language model", "Search engine", "OS", "DB"],
          0,
          "EASY",
        ],
        [
          "Computer vision handles?",
          ["Images/video", "Audio", "DB", "CSS"],
          0,
          "EASY",
        ],

        [
          "Overfitting means?",
          ["Too specific model", "Too slow", "Too secure", "Too fast"],
          0,
          "MEDIUM",
        ],
        [
          "Training vs inference difference?",
          ["Learning vs using", "Speed", "Security", "UI"],
          0,
          "MEDIUM",
        ],
        [
          "Neural nets inspired by?",
          ["Brain neurons", "CPU", "Internet", "DB"],
          0,
          "MEDIUM",
        ],
        [
          "Bias in AI causes?",
          ["Unfair predictions", "Speed", "Security", "UI"],
          0,
          "MEDIUM",
        ],
        [
          "GPU used in AI because?",
          ["Parallel processing", "UI", "Security", "CSS"],
          0,
          "MEDIUM",
        ],

        [
          "Transformer models use?",
          ["Attention mechanism", "Cache", "SQL", "CSS"],
          0,
          "HARD",
        ],
        [
          "Gradient descent minimizes?",
          ["Loss function", "Memory", "Disk", "CPU temp"],
          0,
          "HARD",
        ],
        [
          "LLM tokenization splits?",
          ["Text into tokens", "Images", "Memory", "Code"],
          0,
          "HARD",
        ],
        [
          "Reinforcement learning optimizes?",
          ["Rewards", "Security", "UI", "CSS"],
          0,
          "HARD",
        ],
        [
          "AGI means?",
          ["General intelligence AI", "Gaming AI", "Graphics AI", "None"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 17,
      title: "Hardware & Performance",
      questions: [
        [
          "CPU does?",
          ["Processing", "Storage", "Networking", "Display"],
          0,
          "EASY",
        ],
        ["RAM is?", ["Volatile memory", "Permanent", "GPU", "Disk"], 0, "EASY"],
        [
          "SSD faster than HDD because?",
          ["No moving parts", "Bigger", "Heavier", "Cloud"],
          0,
          "EASY",
        ],
        [
          "GPU best for?",
          ["Parallel tasks", "Storage", "UI", "Network"],
          0,
          "EASY",
        ],
        [
          "Clock speed measures?",
          ["CPU cycles/sec", "RAM", "Disk", "Network"],
          0,
          "EASY",
        ],

        [
          "Cache memory purpose?",
          ["Faster access", "Storage", "Security", "UI"],
          0,
          "MEDIUM",
        ],
        [
          "Multi-core improves?",
          ["Parallel processing", "Storage", "Design", "CSS"],
          0,
          "MEDIUM",
        ],
        [
          "Bottleneck means?",
          ["Performance limiter", "Security", "UI", "DB"],
          0,
          "MEDIUM",
        ],
        [
          "I/O wait refers to?",
          ["Waiting for disk/net", "CPU speed", "GPU lag", "UI"],
          0,
          "MEDIUM",
        ],
        [
          "Overclocking risk?",
          ["Heat damage", "Security", "DB loss", "CSS bug"],
          0,
          "MEDIUM",
        ],

        [
          "CPU pipeline improves?",
          ["Instruction throughput", "Security", "UI", "CSS"],
          0,
          "HARD",
        ],
        [
          "Memory leak leads to?",
          ["RAM exhaustion", "Disk crash", "UI lag only", "Network error"],
          0,
          "HARD",
        ],
        [
          "NUMA architecture affects?",
          ["Memory access speed", "UI", "Security", "CSS"],
          0,
          "HARD",
        ],
        [
          "Thermal throttling causes?",
          ["CPU slowdown", "Speed boost", "Memory gain", "Security"],
          0,
          "HARD",
        ],
        [
          "Latency vs throughput difference?",
          ["Delay vs volume", "Same", "Security", "UI"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 18,
      title: "Tech History & Evolution",
      questions: [
        [
          "Internet started as?",
          ["ARPANET", "Google", "WWW", "Ethernet"],
          0,
          "EASY",
        ],
        [
          "WWW inventor?",
          ["Tim Berners-Lee", "Jobs", "Gates", "Musk"],
          0,
          "EASY",
        ],
        ["First iPhone year?", ["2007", "2005", "2008", "2010"], 0, "EASY"],
        [
          "Linux creator?",
          ["Linus Torvalds", "Stallman", "Jobs", "Gates"],
          0,
          "EASY",
        ],
        [
          "Git creator?",
          ["Linus Torvalds", "Jobs", "Gates", "Berners-Lee"],
          0,
          "EASY",
        ],

        [
          "Why open-source matters?",
          ["Community collaboration", "Security only", "UI", "Speed"],
          0,
          "MEDIUM",
        ],
        [
          "Moore’s Law predicts?",
          ["Transistor doubling", "Internet speed", "UI growth", "Security"],
          0,
          "MEDIUM",
        ],
        [
          "Cloud rise reduced?",
          ["On-prem hardware need", "Security", "UI", "RAM"],
          0,
          "MEDIUM",
        ],
        [
          "Mobile revolution changed?",
          ["App ecosystem", "Only calls", "Servers", "CSS"],
          0,
          "MEDIUM",
        ],
        [
          "DevOps emerged to solve?",
          ["Dev-Ops gap", "UI", "Security", "Storage"],
          0,
          "MEDIUM",
        ],

        [
          "Web2 vs Web3 key diff?",
          ["Centralized vs decentralized", "Speed", "UI", "Security"],
          0,
          "HARD",
        ],
        [
          "Microservices evolved from?",
          ["Monolith scaling issues", "UI", "Security", "CSS"],
          0,
          "HARD",
        ],
        [
          "Browser wars improved?",
          ["Web standards", "Security", "UI design", "RAM"],
          0,
          "HARD",
        ],
        [
          "Virtualization enabled?",
          ["Cloud computing", "UI", "Security", "CSS"],
          0,
          "HARD",
        ],
        [
          "AI boom due to?",
          ["Data + compute", "UI", "Security", "CSS"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 19,
      title: "Programming Logic & Debugging",
      questions: [
        [
          "Bug usually comes from?",
          ["Logic errors", "Keyboard", "Mouse", "Monitor"],
          0,
          "EASY",
        ],
        [
          "Compiler error occurs at?",
          ["Compile time", "Runtime", "Deploy", "Testing"],
          0,
          "EASY",
        ],
        [
          "Debugger helps?",
          ["Step through code", "Speed app", "Deploy", "UI"],
          0,
          "EASY",
        ],
        [
          "Syntax error means?",
          ["Wrong grammar", "Logic issue", "Security bug", "Memory leak"],
          0,
          "EASY",
        ],
        [
          "Infinite loop causes?",
          ["Program hang", "Faster run", "Security", "Cache"],
          0,
          "EASY",
        ],

        [
          "Logging helps find?",
          ["Runtime issues", "UI", "CSS", "Security"],
          0,
          "MEDIUM",
        ],
        [
          "Edge case means?",
          ["Rare scenario", "Common bug", "UI", "Security"],
          0,
          "MEDIUM",
        ],
        [
          "Stack trace shows?",
          ["Error path", "UI tree", "CSS", "Security"],
          0,
          "MEDIUM",
        ],
        [
          "Refactoring improves?",
          ["Code quality", "Security only", "UI", "Storage"],
          0,
          "MEDIUM",
        ],
        [
          "Memory leak debug tool?",
          ["Profiler", "Browser", "UI", "CSS"],
          0,
          "MEDIUM",
        ],

        [
          "Heisenbug means?",
          ["Bug changes when observed", "Easy bug", "UI bug", "Security"],
          0,
          "HARD",
        ],
        [
          "Race condition fix?",
          ["Synchronization", "UI", "CSS", "Storage"],
          0,
          "HARD",
        ],
        [
          "Deadlock debug needs?",
          ["Thread analysis", "UI", "CSS", "Security"],
          0,
          "HARD",
        ],
        [
          "Off-by-one error occurs in?",
          ["Loops/indexes", "Security", "UI", "CSS"],
          0,
          "HARD",
        ],
        [
          "Undefined behavior means?",
          ["Unpredictable result", "Security", "UI", "DB"],
          0,
          "HARD",
        ],
      ],
    },
    {
      quizNumber: 20,
      title: "Futuristic Systems & Advanced Concepts",
      questions: [
        [
          "Blockchain stores?",
          ["Distributed ledger", "Images", "CSS", "RAM"],
          0,
          "EASY",
        ],
        [
          "Quantum computer uses?",
          ["Qubits", "Bits", "RAM", "Pixels"],
          0,
          "EASY",
        ],
        [
          "AR adds?",
          ["Digital to real world", "Storage", "Speed", "Security"],
          0,
          "EASY",
        ],
        [
          "Edge computing processes data?",
          ["Near source", "Cloud only", "DB", "CSS"],
          0,
          "EASY",
        ],
        [
          "Self-driving cars rely on?",
          ["AI sensors", "CSS", "DB", "RAM"],
          0,
          "EASY",
        ],

        [
          "Smart contracts run on?",
          ["Blockchain", "Cloud", "UI", "DB"],
          0,
          "MEDIUM",
        ],
        [
          "Metaverse needs?",
          ["VR/AR tech", "CSS", "DB", "Security"],
          0,
          "MEDIUM",
        ],
        ["5G improves?", ["Low latency", "UI", "CSS", "Security"], 0, "MEDIUM"],
        [
          "Digital twins simulate?",
          ["Real systems", "CSS", "UI", "Security"],
          0,
          "MEDIUM",
        ],
        [
          "IoT risk comes from?",
          ["Many connected devices", "CSS", "UI", "RAM"],
          0,
          "MEDIUM",
        ],

        [
          "Quantum supremacy means?",
          ["Quantum faster than classical", "UI", "Security", "CSS"],
          0,
          "HARD",
        ],
        [
          "Zero trust security means?",
          ["Verify everything", "Trust all", "UI", "CSS"],
          0,
          "HARD",
        ],
        [
          "Neuromorphic computing mimics?",
          ["Brain architecture", "GPU", "Cloud", "CSS"],
          0,
          "HARD",
        ],
        [
          "Federated learning trains?",
          ["Across devices", "In DB", "UI", "CSS"],
          0,
          "HARD",
        ],
        [
          "Exascale computing refers to?",
          ["10^18 ops/sec", "Cloud", "CSS", "UI"],
          0,
          "HARD",
        ],
      ],
    },
  ];

  const category = await prisma.category.upsert({
    where: { name: "Tech & Coding" },
    update: {},
    create: { name: "Tech & Coding" },
  });

  for (const quiz of techData) {
    const existingQuiz = await prisma.quiz.findFirst({
      where: { title: quiz.title, categoryId: category.id },
    });

    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          title: quiz.title,
          quizNumber: quiz.quizNumber,
          timeLimit: 5,
          totalPoints: 60,
          categoryId: category.id,
          Question: {
            create: quiz.questions.map((q) =>
              shuffleAndFormat(q[0], q[1], q[2], q[3]),
            ),
          },
        },
      });
      console.log(`✅ Seeded: ${quiz.title}`);
    }
  }

  console.log("🏁 Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());  