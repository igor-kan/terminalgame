"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Terminal,
  User,
  Trophy,
  BookOpen,
  Sword,
  Target,
  ChevronRight,
  Settings,
  Sun,
  Moon,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Info,
  PanelRightClose,
  PanelRightOpen,
  GripVertical,
} from "lucide-react"

// Types
type ShellType = "bash" | "cmd" | "powershell" | "macos"
type GameMode = "menu" | "tutorial" | "quest" | "arena" | "terminal"
type FileType = "file" | "directory" | "symlink" | "device" | "pipe"

interface FileSystemNode {
  name: string
  type: FileType
  content?: string | Uint8Array
  mimeType?: string
  size: number
  permissions: string
  owner: string
  group: string
  created: Date
  modified: Date
  accessed: Date
  children?: { [key: string]: FileSystemNode }
  target?: string // for symlinks
  hidden?: boolean
}

interface Drive {
  letter: string
  label: string
  type: "local" | "network" | "removable"
  totalSpace: number
  freeSpace: number
  fileSystem: string
  root: FileSystemNode
}

interface GameState {
  currentDirectory: string
  currentDrive: string
  drives: { [key: string]: Drive }
  shell: ShellType
  mode: GameMode
  level: number
  xp: number
  currentQuest?: Quest
  currentTutorial?: Tutorial
  commandHistory: string[]
  historyIndex: number
  environment: { [key: string]: string }
  darkMode: boolean
  processes: Process[]
}

interface Process {
  pid: number
  name: string
  cpu: number
  memory: number
  user: string
}

interface Quest {
  id: string
  title: string
  description: string
  objective: string
  commands: string[]
  story: string[]
  completed: boolean
  xpReward: number
  requiredFiles?: string[]
  progress: string[]
}

interface Tutorial {
  id: string
  title: string
  steps: TutorialStep[]
  currentStep: number
}

interface TutorialStep {
  instruction: string
  expectedCommand: string
  hint: string
  explanation: string
  validation?: (output: string, state: GameState) => boolean
}

interface CommandResult {
  output: string
  error?: string
  exitCode: number
  newState?: Partial<GameState>
}

interface GamePaneContent {
  type: "tutorial" | "quest" | "arena" | "none"
  title?: string
  content?: string
  progress?: number
  maxProgress?: number
  currentStep?: string
  hint?: string
  objective?: string
  status?: "active" | "completed" | "failed"
}

export default function TerminalGame() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState())
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "Terminal Academy v3.0.0 - Advanced Command Line Training Simulator",
    "Enhanced Multi-Shell Environment with Realistic File System Simulation",
    "Copyright (c) 2024 Terminal Academy. All rights reserved.",
    "",
    "Type 'help' for available commands or select a game mode to begin.",
    "",
  ])
  const [currentInput, setCurrentInput] = useState("")
  const [showHints, setShowHints] = useState(true)
  const [gamePaneContent, setGamePaneContent] = useState<GamePaneContent>({ type: "none" })
  const [showGamePane, setShowGamePane] = useState(false)
  const [gamePaneWidth, setGamePaneWidth] = useState(40) // percentage
  const [isResizing, setIsResizing] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new content is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && gameState.mode !== "menu") {
      inputRef.current.focus()
    }
  }, [gameState.mode])

  // Update game pane when tutorial/quest state changes
  useEffect(() => {
    updateGamePane()
  }, [gameState.currentTutorial, gameState.currentQuest, gameState.mode])

  // Show/hide game pane based on mode
  useEffect(() => {
    const shouldShow = gameState.mode === "tutorial" || gameState.mode === "quest" || gameState.mode === "arena"
    setShowGamePane(shouldShow)
  }, [gameState.mode])

  const addToHistory = (text: string) => {
    setTerminalHistory((prev) => [...prev, text])
  }

  const updateGamePane = () => {
    if (gameState.mode === "tutorial" && gameState.currentTutorial) {
      const tutorial = gameState.currentTutorial
      const currentStep = tutorial.steps[tutorial.currentStep]

      setGamePaneContent({
        type: "tutorial",
        title: tutorial.title,
        content: currentStep.instruction,
        progress: tutorial.currentStep + 1,
        maxProgress: tutorial.steps.length,
        currentStep: `Step ${tutorial.currentStep + 1} of ${tutorial.steps.length}`,
        hint: showHints ? currentStep.hint : undefined,
        status: "active",
      })
    } else if (gameState.mode === "quest" && gameState.currentQuest) {
      const quest = gameState.currentQuest

      setGamePaneContent({
        type: "quest",
        title: quest.title,
        content: quest.description,
        objective: quest.objective,
        status: quest.completed ? "completed" : "active",
      })
    } else if (gameState.mode === "arena") {
      setGamePaneContent({
        type: "arena",
        title: "Challenge Arena",
        content: "Prepare for advanced command-line challenges and competitions.",
        status: "active",
      })
    } else {
      setGamePaneContent({ type: "none" })
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((containerRect.right - e.clientX) / containerRect.width) * 100
      const clampedWidth = Math.max(20, Math.min(60, newWidth)) // Between 20% and 60%
      setGamePaneWidth(clampedWidth)
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const getPrompt = () => {
    const user = gameState.environment.USER || "agent"
    const hostname = gameState.environment.HOSTNAME || "terminal-academy"
    const currentDir = gameState.currentDirectory

    const prompts = {
      bash: `${user}@${hostname}:${currentDir}$ `,
      macos: `${hostname}:${currentDir.split("/").pop() || "/"} ${user}$ `,
      cmd: `${gameState.currentDrive}:${currentDir.replace(/\//g, "\\")}> `,
      powershell: `PS ${gameState.currentDrive}:${currentDir.replace(/\//g, "\\")}> `,
    }
    return prompts[gameState.shell]
  }

  const getCurrentNode = (): FileSystemNode | null => {
    const drive = gameState.drives[gameState.currentDrive]
    if (!drive) return null

    const pathParts = gameState.currentDirectory.split("/").filter(Boolean)
    let current = drive.root

    for (const part of pathParts) {
      if (current.children && current.children[part]) {
        current = current.children[part]
      } else {
        return null
      }
    }

    return current
  }

  const resolvePath = (path: string): { drive: string; path: string } => {
    if (path.startsWith("/")) {
      return { drive: gameState.currentDrive, path }
    }

    if (path.match(/^[A-Z]:/i)) {
      const drive = path.substring(0, 2).toUpperCase()
      const remainingPath = path.substring(2) || "/"
      return { drive, path: remainingPath.replace(/\\/g, "/") }
    }

    // Relative path
    const currentPath = gameState.currentDirectory
    if (path === "." || path === "") {
      return { drive: gameState.currentDrive, path: currentPath }
    }

    if (path === "..") {
      const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/"
      return { drive: gameState.currentDrive, path: parentPath }
    }

    const newPath = currentPath === "/" ? `/${path}` : `${currentPath}/${path}`
    return { drive: gameState.currentDrive, path: newPath }
  }

  const getNodeAtPath = (drive: string, path: string): FileSystemNode | null => {
    const driveObj = gameState.drives[drive]
    if (!driveObj) return null

    const pathParts = path.split("/").filter(Boolean)
    let current = driveObj.root

    for (const part of pathParts) {
      if (current.children && current.children[part]) {
        current = current.children[part]
      } else {
        return null
      }
    }

    return current
  }

  const updateFileSystem = (drive: string, path: string, node: FileSystemNode | null): boolean => {
    const driveObj = gameState.drives[drive]
    if (!driveObj) return false

    const pathParts = path.split("/").filter(Boolean)
    let current = driveObj.root

    // Navigate to parent directory
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      if (current.children && current.children[part]) {
        current = current.children[part]
      } else {
        return false
      }
    }

    const fileName = pathParts[pathParts.length - 1]

    if (node === null) {
      // Delete file/directory
      if (current.children && current.children[fileName]) {
        delete current.children[fileName]
        return true
      }
    } else {
      // Add/update file/directory
      if (!current.children) current.children = {}
      current.children[fileName] = node
      return true
    }

    return false
  }

  const executeCommand = (command: string) => {
    const prompt = getPrompt()
    addToHistory(`${prompt}${command}`)

    // Add to command history
    if (command.trim()) {
      setGameState((prev) => ({
        ...prev,
        commandHistory: [...prev.commandHistory.slice(-99), command],
        historyIndex: prev.commandHistory.length + 1,
      }))
    }

    if (gameState.mode === "tutorial" && gameState.currentTutorial) {
      handleTutorialCommand(command)
      return
    }

    if (gameState.mode === "quest" && gameState.currentQuest) {
      handleQuestCommand(command)
      return
    }

    // Execute command based on shell
    const result = executeShellCommand(command)

    if (result.error) {
      addToHistory(result.error)
    }

    if (result.output) {
      addToHistory(result.output)
    }

    if (result.newState) {
      setGameState((prev) => ({ ...prev, ...result.newState }))
    }
  }

  const executeShellCommand = (command: string): CommandResult => {
    const args = command.trim().split(/\s+/)
    const cmd = args[0].toLowerCase()

    // Universal commands
    switch (cmd) {
      case "help":
        return showHelp()
      case "tutorial":
        return startTutorialMode()
      case "quest":
        return startQuestMode()
      case "arena":
        return startArenaMode()
      case "shell":
        return switchShell(args[1] as ShellType)
      case "status":
        return showStatus()
      case "clear":
      case "cls":
        setTerminalHistory([])
        return { output: "", exitCode: 0 }
      case "exit":
        return {
          output: "Returning to main menu...",
          exitCode: 0,
          newState: { mode: "menu" },
        }
      case "history":
        return showHistory()
    }

    // Shell-specific commands
    switch (gameState.shell) {
      case "bash":
      case "macos":
        return executeBashCommand(cmd, args)
      case "cmd":
        return executeCmdCommand(cmd, args)
      case "powershell":
        return executePowerShellCommand(cmd, args)
      default:
        return { output: "", error: `${cmd}: command not found`, exitCode: 127 }
    }
  }

  const executeBashCommand = (cmd: string, args: string[]): CommandResult => {
    switch (cmd) {
      case "ls":
        return listDirectory(args)
      case "pwd":
        return { output: gameState.currentDirectory, exitCode: 0 }
      case "cd":
        return changeDirectory(args[1] || "~")
      case "mkdir":
        return createDirectory(args.slice(1))
      case "rmdir":
        return removeDirectory(args.slice(1))
      case "rm":
        return removeFile(args.slice(1))
      case "cp":
        return copyFile(args.slice(1))
      case "mv":
        return moveFile(args.slice(1))
      case "cat":
        return displayFile(args.slice(1))
      case "touch":
        return createFile(args.slice(1))
      case "find":
        return findFiles(args.slice(1))
      case "grep":
        return grepFiles(args.slice(1))
      case "chmod":
        return changePermissions(args.slice(1))
      case "chown":
        return changeOwnership(args.slice(1))
      case "df":
        return showDiskUsage()
      case "du":
        return showDirectoryUsage(args.slice(1))
      case "ps":
        return showProcesses(args.slice(1))
      case "top":
        return showTop()
      case "kill":
        return killProcess(args.slice(1))
      case "killall":
        return killAllProcesses(args.slice(1))
      case "which":
        return whichCommand(args.slice(1))
      case "whereis":
        return whereisCommand(args.slice(1))
      case "file":
        return fileCommand(args.slice(1))
      case "head":
        return headCommand(args.slice(1))
      case "tail":
        return tailCommand(args.slice(1))
      case "wc":
        return wordCount(args.slice(1))
      case "sort":
        return sortCommand(args.slice(1))
      case "uniq":
        return uniqCommand(args.slice(1))
      case "whoami":
        return { output: gameState.environment.USER || "agent", exitCode: 0 }
      case "id":
        return showUserInfo()
      case "groups":
        return showGroups()
      case "date":
        return { output: new Date().toString(), exitCode: 0 }
      case "uptime":
        return showUptime()
      case "uname":
        return showSystemInfo(args.slice(1))
      case "env":
        return showEnvironment()
      case "export":
        return exportVariable(args.slice(1))
      case "alias":
        return showAliases(args.slice(1))
      case "echo":
        return { output: args.slice(1).join(" "), exitCode: 0 }
      case "man":
        return showManual(args[1])
      case "info":
        return showInfo(args[1])
      case "apropos":
        return aproposCommand(args.slice(1))
      default:
        return { output: "", error: `bash: ${cmd}: command not found`, exitCode: 127 }
    }
  }

  const executeCmdCommand = (cmd: string, args: string[]): CommandResult => {
    switch (cmd) {
      case "dir":
        return listDirectory(args)
      case "cd":
        return changeDirectory(args[1] || "%USERPROFILE%")
      case "md":
      case "mkdir":
        return createDirectory(args.slice(1))
      case "rd":
      case "rmdir":
        return removeDirectory(args.slice(1))
      case "del":
      case "erase":
        return removeFile(args.slice(1))
      case "copy":
        return copyFile(args.slice(1))
      case "xcopy":
        return xcopyCommand(args.slice(1))
      case "robocopy":
        return robocopyCommand(args.slice(1))
      case "move":
        return moveFile(args.slice(1))
      case "ren":
      case "rename":
        return renameFile(args.slice(1))
      case "type":
        return displayFile(args.slice(1))
      case "more":
        return moreCommand(args.slice(1))
      case "find":
        return findstrCommand(args.slice(1))
      case "findstr":
        return findstrCommand(args.slice(1))
      case "attrib":
        return attribCommand(args.slice(1))
      case "tree":
        return showTree(args.slice(1))
      case "tasklist":
        return tasklistCommand(args.slice(1))
      case "taskkill":
        return taskkillCommand(args.slice(1))
      case "systeminfo":
        return systeminfoCommand()
      case "ver":
        return { output: "Microsoft Windows [Version 10.0.19044.1234]", exitCode: 0 }
      case "date":
        return { output: new Date().toLocaleDateString(), exitCode: 0 }
      case "time":
        return { output: new Date().toLocaleTimeString(), exitCode: 0 }
      case "vol":
        return showVolume()
      case "chkdsk":
        return chkdskCommand(args.slice(1))
      case "diskpart":
        return diskpartCommand()
      case "net":
        return netCommand(args.slice(1))
      case "ping":
        return pingCommand(args.slice(1))
      case "ipconfig":
        return ipconfigCommand(args.slice(1))
      case "netstat":
        return netstatCommand(args.slice(1))
      case "echo":
        return { output: args.slice(1).join(" "), exitCode: 0 }
      case "set":
        return setCommand(args.slice(1))
      case "path":
        return { output: gameState.environment.PATH || "", exitCode: 0 }
      default:
        return {
          output: "",
          error: `'${cmd}' is not recognized as an internal or external command,\noperable program or batch file.`,
          exitCode: 1,
        }
    }
  }

  const executePowerShellCommand = (cmd: string, args: string[]): CommandResult => {
    switch (cmd) {
      case "get-childitem":
      case "gci":
      case "ls":
      case "dir":
        return listDirectory(args)
      case "set-location":
      case "sl":
      case "cd":
        return changeDirectory(args[1] || "~")
      case "new-item":
      case "ni":
        return createItem(args.slice(1))
      case "remove-item":
      case "ri":
      case "del":
        return removeFile(args.slice(1))
      case "copy-item":
      case "ci":
      case "copy":
        return copyFile(args.slice(1))
      case "move-item":
      case "mi":
      case "move":
        return moveFile(args.slice(1))
      case "rename-item":
        return renameFile(args.slice(1))
      case "get-content":
      case "gc":
      case "cat":
      case "type":
        return displayFile(args.slice(1))
      case "set-content":
      case "sc":
        return setContent(args.slice(1))
      case "add-content":
      case "ac":
        return addContent(args.slice(1))
      case "select-string":
        return selectString(args.slice(1))
      case "where-object":
      case "where":
        return whereObject(args.slice(1))
      case "sort-object":
      case "sort":
        return sortObject(args.slice(1))
      case "get-process":
      case "gps":
      case "ps":
        return getProcess(args.slice(1))
      case "stop-process":
      case "spps":
      case "kill":
        return stopProcess(args.slice(1))
      case "get-service":
      case "gsv":
        return getService(args.slice(1))
      case "start-service":
        return startService(args.slice(1))
      case "stop-service":
        return stopService(args.slice(1))
      case "get-eventlog":
        return getEventLog(args.slice(1))
      case "get-wmiobject":
        return getWmiObject(args.slice(1))
      case "get-computerinfo":
        return getComputerInfo()
      case "get-executionpolicy":
        return getExecutionPolicy()
      case "set-executionpolicy":
        return setExecutionPolicy(args.slice(1))
      case "get-location":
      case "gl":
      case "pwd":
        return { output: gameState.currentDirectory, exitCode: 0 }
      case "get-date":
        return { output: new Date().toString(), exitCode: 0 }
      case "get-host":
        return getHost()
      case "get-variable":
      case "gv":
        return getVariable(args.slice(1))
      case "set-variable":
      case "sv":
        return setVariable(args.slice(1))
      case "write-output":
      case "write":
      case "echo":
        return { output: args.slice(1).join(" "), exitCode: 0 }
      case "write-host":
        return { output: args.slice(1).join(" "), exitCode: 0 }
      case "get-command":
      case "gcm":
        return getCommand(args.slice(1))
      case "get-alias":
      case "gal":
        return getAlias(args.slice(1))
      case "invoke-expression":
      case "iex":
        return invokeExpression(args.slice(1))
      default:
        return {
          output: "",
          error: `The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program.\nCheck the spelling of the name, or if a path was included, verify that the path is correct and try again.`,
          exitCode: 1,
        }
    }
  }

  // Enhanced file system operations
  const listDirectory = (args: string[]): CommandResult => {
    const currentNode = getCurrentNode()
    if (!currentNode || currentNode.type !== "directory") {
      return { output: "", error: "Not a directory", exitCode: 1 }
    }

    const showHidden = args.includes("-a") || args.includes("-la") || args.includes("/a") || args.includes("-Force")
    const longFormat = args.includes("-l") || args.includes("-la") || args.includes("/l")
    const children = currentNode.children || {}

    let output = ""

    if (gameState.shell === "cmd") {
      const drive = gameState.drives[gameState.currentDrive]
      output += ` Volume in drive ${gameState.currentDrive} is ${drive.label}\n`
      output += ` Volume Serial Number is 1234-5678\n\n`
      output += ` Directory of ${gameState.currentDrive}:${gameState.currentDirectory.replace(/\//g, "\\")}\n\n`
    }

    const entries = Object.values(children)
      .filter((node) => showHidden || !node.hidden)
      .sort((a, b) => {
        if (a.type === "directory" && b.type !== "directory") return -1
        if (a.type !== "directory" && b.type === "directory") return 1
        return a.name.localeCompare(b.name)
      })

    if (gameState.shell === "bash" || gameState.shell === "macos") {
      if (longFormat) {
        let totalBlocks = 0
        entries.forEach((entry) => (totalBlocks += Math.ceil(entry.size / 1024)))
        output += `total ${totalBlocks}\n`

        entries.forEach((entry) => {
          const perms = entry.permissions
          const links = entry.type === "directory" ? "2" : "1"
          const owner = entry.owner.padEnd(8)
          const group = entry.group.padEnd(8)
          const size = entry.size.toString().padStart(8)
          const date = entry.modified.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
          const name = entry.type === "directory" ? `${entry.name}/` : entry.name

          output += `${perms} ${links} ${owner} ${group} ${size} ${date} ${name}\n`
        })
      } else {
        const names = entries.map((entry) => {
          let name = entry.name
          if (entry.type === "directory") name += "/"
          if (entry.type === "symlink") name += "@"
          return name
        })
        output += names.join("  ") + "\n"
      }
    } else if (gameState.shell === "cmd") {
      entries.forEach((entry) => {
        const date = entry.modified.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })
        const time = entry.modified.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
        const size = entry.type === "directory" ? "<DIR>".padStart(14) : entry.size.toString().padStart(14)
        output += `${date}  ${time}    ${size} ${entry.name}\n`
      })

      const fileCount = entries.filter((e) => e.type === "file").length
      const dirCount = entries.filter((e) => e.type === "directory").length
      const totalSize = entries.filter((e) => e.type === "file").reduce((sum, e) => sum + e.size, 0)

      output += `               ${fileCount} File(s) ${totalSize.toLocaleString()} bytes\n`
      output += `               ${dirCount} Dir(s)  ${gameState.drives[gameState.currentDrive].freeSpace.toLocaleString()} bytes free\n`
    } else if (gameState.shell === "powershell") {
      output += "\n    Directory: " + gameState.currentDirectory + "\n\n"
      output += "Mode                LastWriteTime         Length Name\n"
      output += "----                -------------         ------ ----\n"

      entries.forEach((entry) => {
        const mode = entry.type === "directory" ? "d-----" : "-a----"
        const date = entry.modified.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })
        const time = entry.modified.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
        const size = entry.type === "directory" ? "" : entry.size.toString().padStart(10)
        output += `${mode}        ${date}   ${time} ${size} ${entry.name}\n`
      })
    }

    return { output, exitCode: 0 }
  }

  const changeDirectory = (path?: string): CommandResult => {
    if (!path || path === "~" || path === "%USERPROFILE%") {
      const homePath = gameState.shell === "cmd" || gameState.shell === "powershell" ? "/Users/agent" : "/home/agent"

      return {
        output: "",
        exitCode: 0,
        newState: { currentDirectory: homePath },
      }
    }

    const { drive, path: resolvedPath } = resolvePath(path)
    const targetNode = getNodeAtPath(drive, resolvedPath)

    if (!targetNode) {
      const errorMsg =
        gameState.shell === "cmd"
          ? "The system cannot find the path specified."
          : gameState.shell === "powershell"
            ? `Set-Location : Cannot find path '${path}' because it does not exist.`
            : `cd: ${path}: No such file or directory`

      return { output: "", error: errorMsg, exitCode: 1 }
    }

    if (targetNode.type !== "directory") {
      const errorMsg =
        gameState.shell === "cmd"
          ? "The directory name is invalid."
          : gameState.shell === "powershell"
            ? `Set-Location : Path '${path}' is not a directory.`
            : `cd: ${path}: Not a directory`

      return { output: "", error: errorMsg, exitCode: 1 }
    }

    return {
      output: "",
      exitCode: 0,
      newState: {
        currentDirectory: resolvedPath,
        currentDrive: drive,
      },
    }
  }

  const createDirectory = (args: string[]): CommandResult => {
    if (args.length === 0) {
      const errorMsg = gameState.shell === "cmd" ? "The syntax of the command is incorrect." : "mkdir: missing operand"
      return { output: "", error: errorMsg, exitCode: 1 }
    }

    const dirName = args[0]
    const currentNode = getCurrentNode()

    if (!currentNode || currentNode.type !== "directory") {
      return { output: "", error: "Cannot create directory", exitCode: 1 }
    }

    if (currentNode.children && currentNode.children[dirName]) {
      const errorMsg =
        gameState.shell === "cmd"
          ? "A subdirectory or file already exists."
          : `mkdir: cannot create directory '${dirName}': File exists`
      return { output: "", error: errorMsg, exitCode: 1 }
    }

    // Create the directory
    const now = new Date()
    const newDir: FileSystemNode = {
      name: dirName,
      type: "directory",
      size: 4096,
      permissions: "drwxr-xr-x",
      owner: gameState.environment.USER || "agent",
      group: "users",
      created: now,
      modified: now,
      accessed: now,
      children: {},
    }

    const newPath = gameState.currentDirectory === "/" ? `/${dirName}` : `${gameState.currentDirectory}/${dirName}`
    updateFileSystem(gameState.currentDrive, newPath, newDir)

    return { output: "", exitCode: 0 }
  }

  const createFile = (args: string[]): CommandResult => {
    if (args.length === 0) {
      return { output: "", error: "touch: missing file operand", exitCode: 1 }
    }

    const fileName = args[0]
    const currentNode = getCurrentNode()

    if (!currentNode || currentNode.type !== "directory") {
      return { output: "", error: "Cannot create file", exitCode: 1 }
    }

    const now = new Date()
    const newFile: FileSystemNode = {
      name: fileName,
      type: "file",
      size: 0,
      permissions: "-rw-r--r--",
      owner: gameState.environment.USER || "agent",
      group: "users",
      created: now,
      modified: now,
      accessed: now,
      content: "",
      mimeType: "text/plain",
    }

    const newPath = gameState.currentDirectory === "/" ? `/${fileName}` : `${gameState.currentDirectory}/${fileName}`
    updateFileSystem(gameState.currentDrive, newPath, newFile)

    return { output: "", exitCode: 0 }
  }

  // Enhanced command implementations
  const showProcesses = (args: string[]): CommandResult => {
    const processes = gameState.processes
    let output = ""

    if (args.includes("-aux") || args.includes("-ef")) {
      output = "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n"
      processes.forEach((proc) => {
        output += `${proc.user.padEnd(8)} ${proc.pid.toString().padStart(5)} ${proc.cpu.toFixed(1).padStart(4)} ${proc.memory.toFixed(1).padStart(4)}  ${(Math.random() * 10000 + 1000).toFixed(0).padStart(6)} ${(Math.random() * 1000 + 100).toFixed(0).padStart(5)} pts/0    S    10:30   0:00 ${proc.name}\n`
      })
    } else {
      output = "  PID TTY          TIME CMD\n"
      processes.forEach((proc) => {
        output += `${proc.pid.toString().padStart(5)} pts/0    00:00:0${Math.floor(Math.random() * 10)} ${proc.name}\n`
      })
    }

    return { output, exitCode: 0 }
  }

  const showTop = (): CommandResult => {
    const output = `top - ${new Date().toLocaleTimeString()} up 2:30, 1 user, load average: 0.15, 0.25, 0.20
Tasks: 156 total,   1 running, 155 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  1.2 sy,  0.0 ni, 96.5 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   8192.0 total,   6144.2 free,   1536.8 used,    511.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   6400.4 avail Mem 

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1234 agent     20   0  125664  15424  10240 S   1.3   0.2   0:02.50 terminal-academy
 5678 root      20   0       0      0      0 S   0.7   0.0   0:01.25 kworker/0:1
 9012 agent     20   0   45312   8192   6144 S   0.3   0.1   0:00.75 bash`

    return { output, exitCode: 0 }
  }

  const findFiles = (args: string[]): CommandResult => {
    if (args.length === 0) {
      return { output: "", error: "find: missing argument", exitCode: 1 }
    }

    const pattern = args[args.indexOf("-name") + 1] || args[0]
    const currentNode = getCurrentNode()

    if (!currentNode) {
      return { output: "", error: "find: cannot access current directory", exitCode: 1 }
    }

    const results: string[] = []

    const searchNode = (node: FileSystemNode, currentPath: string) => {
      if (node.name.includes(pattern.replace(/\*/g, ""))) {
        results.push(currentPath)
      }

      if (node.children) {
        Object.entries(node.children).forEach(([name, child]) => {
          const childPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`
          searchNode(child, childPath)
        })
      }
    }

    searchNode(currentNode, gameState.currentDirectory)

    return { output: results.join("\n"), exitCode: 0 }
  }

  const grepFiles = (args: string[]): CommandResult => {
    if (args.length < 2) {
      return { output: "", error: "grep: missing arguments", exitCode: 1 }
    }

    const pattern = args[0]
    const fileName = args[1]

    const currentNode = getCurrentNode()
    if (!currentNode || !currentNode.children || !currentNode.children[fileName]) {
      return { output: "", error: `grep: ${fileName}: No such file or directory`, exitCode: 1 }
    }

    const file = currentNode.children[fileName]
    if (file.type !== "file") {
      return { output: "", error: `grep: ${fileName}: Is a directory`, exitCode: 1 }
    }

    const content = (file.content as string) || ""
    const lines = content.split("\n")
    const matches = lines.filter((line) => line.includes(pattern))

    return { output: matches.join("\n"), exitCode: 0 }
  }

  const displayFile = (args: string[]): CommandResult => {
    if (args.length === 0) {
      return { output: "", error: "cat: missing file operand", exitCode: 1 }
    }

    const fileName = args[0]
    const currentNode = getCurrentNode()

    if (!currentNode || !currentNode.children || !currentNode.children[fileName]) {
      return { output: "", error: `cat: ${fileName}: No such file or directory`, exitCode: 1 }
    }

    const file = currentNode.children[fileName]
    if (file.type !== "file") {
      return { output: "", error: `cat: ${fileName}: Is a directory`, exitCode: 1 }
    }

    return { output: (file.content as string) || "", exitCode: 0 }
  }

  // Placeholder implementations for remaining commands
  const removeDirectory = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const removeFile = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const copyFile = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const moveFile = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const changePermissions = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const changeOwnership = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const showDiskUsage = (): CommandResult => ({
    output:
      "Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/sda1       48000000 24000000  22000000  53% /",
    exitCode: 0,
  })
  const showDirectoryUsage = (args: string[]): CommandResult => ({ output: "4.0K\t.", exitCode: 0 })
  const killProcess = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const killAllProcesses = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const whichCommand = (args: string[]): CommandResult => ({ output: `/usr/bin/${args[0]}`, exitCode: 0 })
  const whereisCommand = (args: string[]): CommandResult => ({
    output: `${args[0]}: /usr/bin/${args[0]} /usr/share/man/man1/${args[0]}.1.gz`,
    exitCode: 0,
  })
  const fileCommand = (args: string[]): CommandResult => ({ output: `${args[0]}: ASCII text`, exitCode: 0 })
  const headCommand = (args: string[]): CommandResult => ({ output: "First 10 lines of file...", exitCode: 0 })
  const tailCommand = (args: string[]): CommandResult => ({ output: "Last 10 lines of file...", exitCode: 0 })
  const wordCount = (args: string[]): CommandResult => ({ output: "  10  50 300 filename", exitCode: 0 })
  const sortCommand = (args: string[]): CommandResult => ({ output: "Sorted output...", exitCode: 0 })
  const uniqCommand = (args: string[]): CommandResult => ({ output: "Unique lines...", exitCode: 0 })
  const showUserInfo = (): CommandResult => ({
    output: "uid=1000(agent) gid=1000(users) groups=1000(users),4(adm),24(cdrom),27(sudo)",
    exitCode: 0,
  })
  const showGroups = (): CommandResult => ({ output: "users adm cdrom sudo", exitCode: 0 })
  const showUptime = (): CommandResult => ({
    output: " 14:30:25 up 2:30,  1 user,  load average: 0.15, 0.25, 0.20",
    exitCode: 0,
  })
  const showSystemInfo = (args: string[]): CommandResult => ({
    output: "Linux terminal-academy 5.4.0-74-generic #83-Ubuntu SMP x86_64 GNU/Linux",
    exitCode: 0,
  })
  const showEnvironment = (): CommandResult => ({
    output: Object.entries(gameState.environment)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n"),
    exitCode: 0,
  })
  const exportVariable = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const showAliases = (args: string[]): CommandResult => ({
    output: "alias ll='ls -la'\nalias la='ls -A'",
    exitCode: 0,
  })
  const showInfo = (command?: string): CommandResult => ({ output: `Info page for ${command}`, exitCode: 0 })
  const aproposCommand = (args: string[]): CommandResult => ({ output: "Searching manual pages...", exitCode: 0 })

  // CMD specific commands
  const xcopyCommand = (args: string[]): CommandResult => ({ output: "Files copied successfully", exitCode: 0 })
  const robocopyCommand = (args: string[]): CommandResult => ({ output: "Robust file copy completed", exitCode: 0 })
  const renameFile = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const moreCommand = (args: string[]): CommandResult => ({ output: "-- More --", exitCode: 0 })
  const findstrCommand = (args: string[]): CommandResult => ({ output: "Pattern found in files", exitCode: 0 })
  const attribCommand = (args: string[]): CommandResult => ({ output: "File attributes modified", exitCode: 0 })
  const tasklistCommand = (args: string[]): CommandResult => {
    let output = "\nImage Name                     PID Session Name        Session#    Mem Usage\n"
    output += "========================= ======== ================ =========== ============\n"

    gameState.processes.forEach((proc) => {
      const imageName = proc.name.padEnd(25)
      const pid = proc.pid.toString().padStart(8)
      const sessionName = "Services".padEnd(16)
      const sessionNum = "0".padStart(11)
      const memUsage = `${(proc.memory * 1024).toFixed(0)} K`.padStart(12)

      output += `${imageName} ${pid} ${sessionName} ${sessionNum} ${memUsage}\n`
    })

    return { output, exitCode: 0 }
  }
  const taskkillCommand = (args: string[]): CommandResult => ({ output: "Process terminated", exitCode: 0 })
  const systeminfoCommand = (): CommandResult => ({
    output: "Host Name: terminal-academy\nOS Name: Microsoft Windows 10 Pro\nOS Version: 10.0.19044 Build 19044",
    exitCode: 0,
  })
  const showVolume = (): CommandResult => {
    const drive = gameState.drives[gameState.currentDrive]
    return {
      output: ` Volume in drive ${gameState.currentDrive} is ${drive.label}\n Volume Serial Number is 1234-5678`,
      exitCode: 0,
    }
  }
  const showTree = (args: string[]): CommandResult => ({
    output: "Folder PATH listing\nVolume serial number is 1234-5678\n.\n└── Documents",
    exitCode: 0,
  })
  const chkdskCommand = (args: string[]): CommandResult => ({
    output: "The type of the file system is NTFS.\nWindows has checked the file system and found no problems.",
    exitCode: 0,
  })
  const diskpartCommand = (): CommandResult => ({
    output: "Microsoft DiskPart version 10.0.19041.1\nCopyright (C) Microsoft Corporation.",
    exitCode: 0,
  })
  const netCommand = (args: string[]): CommandResult => ({ output: "The command completed successfully.", exitCode: 0 })
  const pingCommand = (args: string[]): CommandResult => ({
    output: `Pinging ${args[0]} with 32 bytes of data:\nReply from 192.168.1.1: bytes=32 time<1ms TTL=64`,
    exitCode: 0,
  })
  const ipconfigCommand = (args: string[]): CommandResult => ({
    output: "Windows IP Configuration\n\nEthernet adapter Ethernet:\n   IPv4 Address: 192.168.1.100",
    exitCode: 0,
  })
  const netstatCommand = (args: string[]): CommandResult => ({
    output: "Active Connections\n\n  Proto  Local Address          Foreign Address        State",
    exitCode: 0,
  })
  const setCommand = (args: string[]): CommandResult => ({
    output: Object.entries(gameState.environment)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n"),
    exitCode: 0,
  })

  // PowerShell specific commands
  const createItem = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const setContent = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const addContent = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const selectString = (args: string[]): CommandResult => ({ output: "Pattern matches found", exitCode: 0 })
  const whereObject = (args: string[]): CommandResult => ({ output: "Filtered objects", exitCode: 0 })
  const sortObject = (args: string[]): CommandResult => ({ output: "Sorted objects", exitCode: 0 })
  const getProcess = (args: string[]): CommandResult => {
    let output = "\nHandles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName\n"
    output += "-------  ------    -----      -----     ------     --  -- -----------\n"

    gameState.processes.forEach((proc) => {
      const handles = Math.floor(Math.random() * 1000 + 100)
        .toString()
        .padStart(7)
      const npm = Math.floor(Math.random() * 50 + 10)
        .toString()
        .padStart(6)
      const pm = Math.floor(Math.random() * 50000 + 5000)
        .toString()
        .padStart(9)
      const ws = Math.floor(Math.random() * 100000 + 10000)
        .toString()
        .padStart(9)
      const cpu = proc.cpu.toFixed(2).padStart(10)
      const id = proc.pid.toString().padStart(6)
      const si = "1".padStart(4)

      output += `${handles}  ${npm}    ${pm}      ${ws}     ${cpu}     ${id}  ${si} ${proc.name}\n`
    })

    return { output, exitCode: 0 }
  }
  const stopProcess = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const getService = (args: string[]): CommandResult => ({
    output:
      "Status   Name               DisplayName\n------   ----               -----------\nRunning  Spooler            Print Spooler",
    exitCode: 0,
  })
  const startService = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const stopService = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const getEventLog = (args: string[]): CommandResult => ({ output: "Event log entries...", exitCode: 0 })
  const getWmiObject = (args: string[]): CommandResult => ({ output: "WMI object information", exitCode: 0 })
  const getComputerInfo = (): CommandResult => ({
    output: "WindowsProductName    : Windows 10 Pro\nWindowsVersion        : 2009\nTotalPhysicalMemory   : 8589934592",
    exitCode: 0,
  })
  const getExecutionPolicy = (): CommandResult => ({ output: "Restricted", exitCode: 0 })
  const setExecutionPolicy = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const getHost = (): CommandResult => ({
    output: "Name             : ConsoleHost\nVersion          : 5.1.19041.1682",
    exitCode: 0,
  })
  const getVariable = (args: string[]): CommandResult => ({ output: "PowerShell variables", exitCode: 0 })
  const setVariable = (args: string[]): CommandResult => ({ output: "", exitCode: 0 })
  const getCommand = (args: string[]): CommandResult => ({ output: "Available commands", exitCode: 0 })
  const getAlias = (args: string[]): CommandResult => ({
    output:
      "CommandType     Name                                               Version    Source\n-----------     ----                                               -------    ------\nAlias           dir -> Get-ChildItem",
    exitCode: 0,
  })
  const invokeExpression = (args: string[]): CommandResult => ({ output: "Expression executed", exitCode: 0 })

  const showHelp = (): CommandResult => {
    const helpText = `Terminal Academy v3.0.0 - Available Commands:

Game Commands:
  help          - Show this help message
  tutorial      - Start tutorial mode
  quest         - Start quest mode  
  arena         - Start challenge arena
  shell <type>  - Switch shell environment (bash, cmd, powershell, macos)
  status        - Show player status
  history       - Show command history
  clear/cls     - Clear terminal
  exit          - Return to main menu

File System Commands (${gameState.shell.toUpperCase()}):
${
  gameState.shell === "bash" || gameState.shell === "macos"
    ? `  ls [-la]      - List directory contents
  pwd           - Print working directory
  cd <dir>      - Change directory
  mkdir <dir>   - Create directory
  rmdir <dir>   - Remove directory
  rm <file>     - Remove file
  cp <src> <dst> - Copy file
  mv <src> <dst> - Move file
  cat <file>    - Display file contents
  touch <file>  - Create empty file
  find <pattern> - Find files
  grep <pattern> <file> - Search in files
  chmod <perms> <file> - Change permissions
  chown <user> <file> - Change ownership
  
System Commands:
  df            - Show disk usage
  du            - Show directory usage
  ps [-aux]     - Show processes
  top           - Show running processes
  kill <pid>    - Kill process
  killall <name> - Kill processes by name
  which <cmd>   - Locate command
  whereis <cmd> - Locate binary/manual
  file <file>   - Determine file type
  head <file>   - Show first lines
  tail <file>   - Show last lines
  wc <file>     - Word count
  sort <file>   - Sort lines
  uniq <file>   - Show unique lines
  
User Commands:
  whoami        - Show current user
  id            - Show user/group IDs
  groups        - Show user groups
  env           - Show environment variables
  export VAR=val - Set environment variable
  alias         - Show aliases
  
Help Commands:
  man <cmd>     - Show manual page
  info <cmd>    - Show info page
  apropos <term> - Search manual pages`
    : gameState.shell === "cmd"
      ? `  dir           - List directory contents
  cd <dir>      - Change directory
  md/mkdir <dir> - Create directory
  rd/rmdir <dir> - Remove directory
  del <file>    - Delete file
  copy <src> <dst> - Copy file
  xcopy <src> <dst> - Extended copy
  robocopy <src> <dst> - Robust copy
  move <src> <dst> - Move file
  ren <old> <new> - Rename file
  type <file>   - Display file contents
  more <file>   - Display file with paging
  find "<text>" <file> - Find text in file
  findstr <pattern> <file> - Search with regex
  attrib <file> - Show/modify file attributes
  tree          - Show directory tree
  
System Commands:
  tasklist      - List running processes
  taskkill /PID <pid> - Kill process
  systeminfo    - Show system information
  ver           - Show Windows version
  date          - Show/set date
  time          - Show/set time
  vol           - Show volume information
  chkdsk        - Check disk
  diskpart      - Disk partition utility
  
Network Commands:
  ping <host>   - Ping network host
  ipconfig      - IP configuration
  netstat       - Network statistics
  net <command> - Network commands
  
Environment:
  set           - Show environment variables
  set VAR=value - Set environment variable
  path          - Show PATH variable
  echo <text>   - Display text`
      : `  Get-ChildItem/ls/dir - List directory contents
  Set-Location/cd <dir> - Change directory
  New-Item <name> -Type Directory - Create directory
  Remove-Item <item> - Remove item
  Copy-Item <src> <dst> - Copy item
  Move-Item <src> <dst> - Move item
  Rename-Item <old> <new> - Rename item
  Get-Content/cat <file> - Display file contents
  Set-Content <file> <text> - Write to file
  Add-Content <file> <text> - Append to file
  Select-String <pattern> <file> - Search in files
  Where-Object {condition} - Filter objects
  Sort-Object <property> - Sort objects
  
System Commands:
  Get-Process/ps - Show processes
  Stop-Process <name/id> - Stop process
  Get-Service   - Show services
  Start-Service <name> - Start service
  Stop-Service <name> - Stop service
  Get-EventLog <log> - Show event logs
  Get-WmiObject <class> - WMI information
  Get-ComputerInfo - Computer information
  
PowerShell Specific:
  Get-ExecutionPolicy - Show execution policy
  Set-ExecutionPolicy <policy> - Set execution policy
  Get-Host      - PowerShell host info
  Get-Variable  - Show variables
  Set-Variable <name> <value> - Set variable
  Get-Command   - Show available commands
  Get-Alias     - Show command aliases
  Invoke-Expression <expr> - Execute expression`
}

Tips:
• Use 'man <command>' (Unix) or help system for detailed help
• Press ↑/↓ arrows for command history
• Use Tab for auto-completion
• Type 'status' to see your progress and system info`

    return { output: helpText, exitCode: 0 }
  }

  const showHistory = (): CommandResult => {
    const history = gameState.commandHistory
      .map((cmd, index) => `${(index + 1).toString().padStart(4)} ${cmd}`)
      .join("\n")

    return { output: history, exitCode: 0 }
  }

  const startTutorialMode = (): CommandResult => {
    const tutorial: Tutorial = {
      id: "basic-commands",
      title: `Basic Commands Tutorial (${gameState.shell.toUpperCase()})`,
      steps: [
        {
          instruction: "Let's start by listing files. Type the appropriate list command for your shell",
          expectedCommand: gameState.shell === "cmd" || gameState.shell === "powershell" ? "dir" : "ls",
          hint: `Use '${gameState.shell === "cmd" || gameState.shell === "powershell" ? "dir" : "ls"}' to list directory contents`,
          explanation: "This command shows all files and directories in your current location.",
        },
        {
          instruction: "Now let's see where we are. Type the appropriate command to show current directory",
          expectedCommand: gameState.shell === "cmd" ? "cd" : "pwd",
          hint: `Use '${gameState.shell === "cmd" ? "cd" : "pwd"}' to show your current directory path`,
          explanation: "Knowing your current location is essential for navigation.",
        },
        {
          instruction: "Let's create a new directory called 'mission_files'",
          expectedCommand:
            gameState.shell === "cmd"
              ? "md mission_files"
              : gameState.shell === "powershell"
                ? "New-Item mission_files -Type Directory"
                : "mkdir mission_files",
          hint: `Use '${gameState.shell === "cmd" ? "md" : gameState.shell === "powershell" ? "New-Item" : "mkdir"}' to create directories`,
          explanation: "You've created a new directory for organizing files.",
        },
      ],
      currentStep: 0,
    }

    setGameState((prev) => ({
      ...prev,
      mode: "tutorial",
      currentTutorial: tutorial,
    }))

    return {
      output: "Tutorial mode activated. Check the right panel for instructions.",
      exitCode: 0,
    }
  }

  const startQuestMode = (): CommandResult => {
    const quest: Quest = {
      id: "data-recovery",
      title: "Operation: Critical Data Recovery",
      description: "A high-security server has been compromised. Critical files are scattered across the system.",
      objective: "Navigate the file system, locate encrypted backup files, and recover the data",
      commands: ["find", "grep", "cat", "ls", "cd", "file"],
      story: [
        "🚨 PRIORITY ALERT: SECURITY BREACH DETECTED",
        "Agent, our primary data center has been infiltrated.",
        "The attackers have scattered critical files throughout the system.",
        "Intelligence suggests backup files contain encryption keys.",
        "Your mission: Use advanced command-line techniques to recover the data.",
        "Time is critical - the self-destruct sequence activates in 45 minutes!",
      ],
      completed: false,
      xpReward: 200,
      requiredFiles: ["backup.dat", "recovery.key", "classified/*"],
      progress: [],
    }

    setGameState((prev) => ({
      ...prev,
      mode: "quest",
      currentQuest: quest,
    }))

    return {
      output: "Quest mode activated. Check the right panel for mission briefing.",
      exitCode: 0,
    }
  }

  const startArenaMode = (): CommandResult => {
    setGameState((prev) => ({
      ...prev,
      mode: "arena",
    }))

    return {
      output: "Challenge Arena activated. Check the right panel for available challenges.",
      exitCode: 0,
    }
  }

  const switchShell = (shell?: ShellType): CommandResult => {
    if (!shell) {
      return {
        output: `Current shell: ${gameState.shell}
Available shells: bash, cmd, powershell, macos

Usage: shell <type>`,
        exitCode: 0,
      }
    }

    const validShells = ["bash", "cmd", "powershell", "macos"]
    if (!validShells.includes(shell)) {
      return {
        output: `Invalid shell: ${shell}
Available shells: ${validShells.join(", ")}`,
        error: "",
        exitCode: 1,
      }
    }

    // Adjust current directory format for Windows shells
    let newDirectory = gameState.currentDirectory
    if ((shell === "cmd" || shell === "powershell") && !gameState.currentDirectory.match(/^[A-Z]:/)) {
      newDirectory = "/Users/agent" // Windows-style home
    } else if (
      (gameState.shell === "cmd" || gameState.shell === "powershell") &&
      (shell === "bash" || shell === "macos")
    ) {
      newDirectory = "/home/agent" // Unix-style home
    }

    const shellNames = {
      bash: "Bash (Bourne Again Shell)",
      macos: "macOS Terminal (Bash-compatible)",
      cmd: "Windows Command Prompt",
      powershell: "Windows PowerShell",
    }

    return {
      output: `Shell environment changed to ${shell.toUpperCase()}
Welcome to ${shellNames[shell]}`,
      exitCode: 0,
      newState: {
        shell,
        currentDirectory: newDirectory,
      },
    }
  }

  const showStatus = (): CommandResult => {
    const drive = gameState.drives[gameState.currentDrive]
    const output = `Terminal Academy - System Status

Agent Profile:
  Agent Level: ${gameState.level}
  Experience Points: ${gameState.xp.toLocaleString()}
  Commands Executed: ${gameState.commandHistory.length}

Active Shell Environment:
  Current Shell: ${gameState.shell.toUpperCase()}
  Working Directory: ${gameState.currentDirectory}
  Current Drive: ${gameState.currentDrive} (${drive.label})
  File System: ${drive.fileSystem}
  
Storage Information:
  Total Space: ${(drive.totalSpace / 1024 ** 3).toFixed(2)} GB
  Free Space: ${(drive.freeSpace / 1024 ** 3).toFixed(2)} GB
  Used Space: ${((drive.totalSpace - drive.freeSpace) / 1024 ** 3).toFixed(2)} GB

System Resources:
  Active Processes: ${gameState.processes.length}
  Memory Usage: ${Math.floor(Math.random() * 40 + 30)}%
  CPU Usage: ${Math.floor(Math.random() * 20 + 5)}%

Network Status:
  Hostname: ${gameState.environment.HOSTNAME}
  User Account: ${gameState.environment.USER}
  Home Directory: ${gameState.environment.HOME}

Mission Progress:
  Current Mode: ${gameState.mode.toUpperCase()}
  ${
    gameState.currentTutorial
      ? `Active Tutorial: ${gameState.currentTutorial.title}
  Tutorial Progress: Step ${gameState.currentTutorial.currentStep + 1}/${gameState.currentTutorial.steps.length}`
      : ""
  }
  ${
    gameState.currentQuest
      ? `Active Mission: ${gameState.currentQuest.title}
  Mission Status: ${gameState.currentQuest.completed ? "COMPLETED" : "IN PROGRESS"}`
      : ""
  }`

    return { output, exitCode: 0 }
  }

  const showManual = (command?: string): CommandResult => {
    if (!command) {
      return { output: "", error: "What manual page do you want?", exitCode: 1 }
    }

    const manPages: { [key: string]: string } = {
      ls: `LS(1)                    User Commands                   LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       List  information  about  the FILEs (the current directory by default).
       Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.

       -a, --all
              do not ignore entries starting with .

       -l     use a long listing format

EXAMPLES
       ls -la
              List all files in long format including hidden files`,

      cd: `CD(1)                    User Commands                   CD(1)

NAME
       cd - change directory

SYNOPSIS
       cd [DIRECTORY]

DESCRIPTION
       Change the current working directory to DIRECTORY.

EXAMPLES
       cd /home/user
              Change to absolute path

       cd ..
              Move up one directory level`,

      pwd: `PWD(1)                   User Commands                   PWD(1)

NAME
       pwd - print name of current/working directory

SYNOPSIS
       pwd [OPTION]...

DESCRIPTION
       Print the full filename of the current working directory.`,
    }

    return {
      output: manPages[command] || `No manual entry for ${command}`,
      exitCode: manPages[command] ? 0 : 1,
    }
  }

  const handleTutorialCommand = (command: string) => {
    if (!gameState.currentTutorial) return

    const currentStep = gameState.currentTutorial.steps[gameState.currentTutorial.currentStep]
    const result = executeShellCommand(command)

    // Add command output first
    if (result.error) {
      addToHistory(result.error)
    }
    if (result.output) {
      addToHistory(result.output)
    }

    // Check if command matches expected
    const commandMatches =
      command.trim().toLowerCase() === currentStep.expectedCommand.toLowerCase() ||
      (currentStep.validation && currentStep.validation(result.output, gameState))

    if (commandMatches) {
      const newXP = gameState.xp + 25
      setGameState((prev) => ({
        ...prev,
        xp: newXP,
        level: Math.floor(newXP / 100) + 1,
      }))

      if (gameState.currentTutorial.currentStep < gameState.currentTutorial.steps.length - 1) {
        const nextStep = gameState.currentTutorial.currentStep + 1
        setGameState((prev) => ({
          ...prev,
          currentTutorial: prev.currentTutorial ? { ...prev.currentTutorial, currentStep: nextStep } : undefined,
        }))
      } else {
        setGameState((prev) => ({
          ...prev,
          xp: prev.xp + 100,
          mode: "terminal",
          currentTutorial: undefined,
        }))
      }
    }
  }

  const handleQuestCommand = (command: string) => {
    if (!gameState.currentQuest) return

    const result = executeShellCommand(command)

    // Add command output
    if (result.error) {
      addToHistory(result.error)
    }
    if (result.output) {
      addToHistory(result.output)
    }

    // Check for quest-relevant commands
    const questCommands = gameState.currentQuest.commands
    const isQuestCommand = questCommands.some((cmd) => command.toLowerCase().includes(cmd.toLowerCase()))

    if (isQuestCommand && result.exitCode === 0) {
      // Enhanced quest progress logic
      const newProgress = [...gameState.currentQuest.progress]

      if (command.includes("find") && command.includes("backup")) {
        newProgress.push("INTEL DISCOVERED: Backup files located in classified directory!")
      } else if (command.includes("cat") && command.includes("recovery")) {
        newProgress.push("ENCRYPTION KEY FOUND: Recovery sequence initiated!")
      } else if (command.includes("grep") && command.includes("classified")) {
        newProgress.push("CLASSIFIED DATA EXTRACTED: Mission parameters updated!")
      }

      setGameState((prev) => ({
        ...prev,
        currentQuest: prev.currentQuest ? { ...prev.currentQuest, progress: newProgress } : undefined,
      }))

      // Simulate quest completion based on command usage
      if (Math.random() > 0.6 || command.includes("recovery.key")) {
        setGameState((prev) => ({
          ...prev,
          xp: prev.xp + (prev.currentQuest?.xpReward || 0),
          mode: "terminal",
          currentQuest: undefined,
        }))
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (currentInput.trim()) {
        executeCommand(currentInput)
      } else {
        addToHistory(getPrompt())
      }
      setCurrentInput("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (gameState.historyIndex > 0) {
        const newIndex = gameState.historyIndex - 1
        setCurrentInput(gameState.commandHistory[newIndex] || "")
        setGameState((prev) => ({ ...prev, historyIndex: newIndex }))
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (gameState.historyIndex < gameState.commandHistory.length) {
        const newIndex = gameState.historyIndex + 1
        setCurrentInput(gameState.commandHistory[newIndex] || "")
        setGameState((prev) => ({ ...prev, historyIndex: newIndex }))
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      // Tab completion would be implemented here
    }
  }

  const toggleTheme = () => {
    setGameState((prev) => ({ ...prev, darkMode: !prev.darkMode }))
  }

  // Enhanced theme classes with better contrast
  const themeClasses = gameState.darkMode ? "bg-gray-900 text-green-400" : "bg-gray-50 text-gray-900"

  const cardClasses = gameState.darkMode
    ? "bg-gray-800 border-green-500/30 text-green-400"
    : "bg-white border-gray-300 text-gray-900"

  const brightTextClass = gameState.darkMode ? "text-green-300" : "text-blue-600"

  const accentTextClass = gameState.darkMode ? "text-cyan-400" : "text-purple-600"

  const terminalClasses = gameState.darkMode
    ? "bg-black text-green-400 border-green-500/30"
    : "bg-white text-gray-900 border-gray-300"

  const GamePane = () => {
    if (gamePaneContent.type === "none") return null

    return (
      <Card className={`${cardClasses} h-full flex flex-col`}>
        <div className="p-4 border-b border-current/20">
          <div className="flex items-center gap-2 mb-2">
            {gamePaneContent.type === "tutorial" && <BookOpen className="w-5 h-5" />}
            {gamePaneContent.type === "quest" && <Sword className="w-5 h-5" />}
            {gamePaneContent.type === "arena" && <Target className="w-5 h-5" />}
            <h3 className={`font-bold text-lg ${brightTextClass}`}>{gamePaneContent.title}</h3>
          </div>

          {gamePaneContent.type === "tutorial" && gamePaneContent.progress && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{gamePaneContent.currentStep}</span>
                <span>
                  {gamePaneContent.progress}/{gamePaneContent.maxProgress}
                </span>
              </div>
              <Progress
                value={(gamePaneContent.progress / (gamePaneContent.maxProgress || 1)) * 100}
                className={gameState.darkMode ? "bg-gray-700" : "bg-gray-200"}
              />
            </div>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {gamePaneContent.type === "quest" && gameState.currentQuest && (
            <div className="space-y-4">
              <div
                className={`p-3 rounded border ${gameState.darkMode ? "border-red-500/50 bg-red-900/20" : "border-red-300 bg-red-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-red-500">CLASSIFIED MISSION BRIEFING</span>
                </div>
                {gameState.currentQuest.story.map((line, index) => (
                  <p key={index} className="text-sm mb-1">
                    {line}
                  </p>
                ))}
              </div>

              <div
                className={`p-3 rounded border ${gameState.darkMode ? "border-blue-500/50 bg-blue-900/20" : "border-blue-300 bg-blue-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-blue-500">PRIMARY OBJECTIVE</span>
                </div>
                <p className="text-sm">{gamePaneContent.objective}</p>
              </div>

              <div
                className={`p-3 rounded border ${gameState.darkMode ? "border-yellow-500/50 bg-yellow-900/20" : "border-yellow-300 bg-yellow-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-500">REQUIRED SKILLS</span>
                </div>
                <p className="text-sm">File navigation, pattern searching, content analysis</p>
                <p className="text-sm mt-1">Target Files: {gameState.currentQuest.requiredFiles?.join(", ")}</p>
              </div>

              {gameState.currentQuest.progress.length > 0 && (
                <div
                  className={`p-3 rounded border ${gameState.darkMode ? "border-green-500/50 bg-green-900/20" : "border-green-300 bg-green-50"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-green-500">MISSION PROGRESS</span>
                  </div>
                  {gameState.currentQuest.progress.map((progress, index) => (
                    <p key={index} className="text-sm mb-1">
                      • {progress}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {gamePaneContent.type === "tutorial" && (
            <div className="space-y-4">
              <div
                className={`p-3 rounded border ${gameState.darkMode ? "border-blue-500/50 bg-blue-900/20" : "border-blue-300 bg-blue-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-blue-500">CURRENT INSTRUCTION</span>
                </div>
                <p className="text-sm">{gamePaneContent.content}</p>
              </div>

              {gamePaneContent.hint && showHints && (
                <div
                  className={`p-3 rounded border ${gameState.darkMode ? "border-yellow-500/50 bg-yellow-900/20" : "border-yellow-300 bg-yellow-50"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-yellow-500">HINT</span>
                  </div>
                  <p className="text-sm">{gamePaneContent.hint}</p>
                </div>
              )}

              <div
                className={`p-3 rounded border ${gameState.darkMode ? "border-gray-500/50 bg-gray-800/20" : "border-gray-300 bg-gray-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4" />
                  <span className="font-semibold">TUTORIAL TIPS</span>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• Type commands in the terminal on the left</li>
                  <li>• Use ↑/↓ arrows for command history</li>
                  <li>• Commands are case-sensitive</li>
                  <li>• Each correct command earns XP</li>
                </ul>
              </div>
            </div>
          )}

          {gamePaneContent.type === "arena" && (
            <div className="space-y-4">
              <div
                className={`p-3 rounded border ${gameState.darkMode ? "border-red-500/50 bg-red-900/20" : "border-red-300 bg-red-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-red-500">CHALLENGE ARENA</span>
                </div>
                <p className="text-sm mb-3">Prepare for advanced command-line challenges and competitions.</p>

                <div className="space-y-2">
                  <h4 className="font-semibold">Available Challenges:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Speed Typing Tests - Race against time</li>
                    <li>• Command Puzzle Solving - Complex file system challenges</li>
                    <li>• Shell Scripting Competitions - Automate solutions</li>
                    <li>• Multi-Shell Mastery - Switch environments rapidly</li>
                    <li>• Network Penetration Simulations - Advanced scenarios</li>
                  </ul>
                </div>
              </div>

              <div
                className={`p-3 rounded border ${gameState.darkMode ? "border-yellow-500/50 bg-yellow-900/20" : "border-yellow-300 bg-yellow-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-500">COMING SOON</span>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• Real-time multiplayer competitions</li>
                  <li>• Leaderboard rankings</li>
                  <li>• Achievement unlocks</li>
                  <li>• Custom challenge creation</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-current/20">
          <div className="flex items-center justify-between text-xs">
            <span>
              Level {gameState.level} • {gameState.xp.toLocaleString()} XP
            </span>
            {gamePaneContent.type === "tutorial" && (
              <div className="flex items-center gap-2">
                <span>Show Hints:</span>
                <Switch checked={showHints} onCheckedChange={setShowHints} className="scale-75" />
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (gameState.mode === "menu") {
    return (
      <div className={`min-h-screen ${themeClasses} p-4 font-mono transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Terminal className="w-10 h-10" />
              <h1 className={`text-5xl font-bold ${gameState.darkMode ? "text-green-400" : "text-gray-900"}`}>
                Terminal Academy
              </h1>
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="sm"
                className={`ml-4 ${gameState.darkMode ? "text-green-400 hover:bg-green-900/20" : "text-gray-700 hover:bg-gray-100"}`}
              >
                {gameState.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
            <p className={`text-xl ${brightTextClass}`}>Master the Command Line Through Realistic System Simulation</p>
            <p className={`text-sm mt-2 ${accentTextClass}`}>
              Enhanced multi-shell environment • Realistic file operations • Advanced command sets
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className={`${cardClasses} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6" />
                <h2 className="text-xl font-bold">Agent Profile</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Level:</span>
                  <Badge
                    variant="outline"
                    className={gameState.darkMode ? "border-green-500 text-green-400" : "border-gray-400"}
                  >
                    {gameState.level}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>XP:</span>
                  <span className={brightTextClass}>{gameState.xp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Commands:</span>
                  <span className={accentTextClass}>{gameState.commandHistory.length}</span>
                </div>
                <Progress
                  value={gameState.xp % 100}
                  className={`mt-2 ${gameState.darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                />
                <p className={`text-xs ${gameState.darkMode ? "text-green-500" : "text-gray-500"}`}>
                  {100 - (gameState.xp % 100)} XP to next level
                </p>
              </div>
            </Card>

            <Card className={`${cardClasses} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="w-6 h-6" />
                <h2 className="text-xl font-bold">System Status</h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Shell:</span>
                  <span className={`uppercase font-mono ${brightTextClass}`}>{gameState.shell}</span>
                </div>
                <div className="flex justify-between">
                  <span>Drive:</span>
                  <span className={accentTextClass}>{gameState.currentDrive}</span>
                </div>
                <div className="flex justify-between">
                  <span>Directory:</span>
                  <span className="text-xs font-mono truncate">{gameState.currentDirectory}</span>
                </div>
                <div className="flex justify-between">
                  <span>Free Space:</span>
                  <span className={brightTextClass}>
                    {(gameState.drives[gameState.currentDrive].freeSpace / 1024 ** 3).toFixed(1)} GB
                  </span>
                </div>
              </div>
            </Card>

            <Card className={`${cardClasses} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6" />
                <h2 className="text-xl font-bold">Shell Environment</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["bash", "macos", "cmd", "powershell"] as ShellType[]).map((shell) => (
                  <Button
                    key={shell}
                    variant={gameState.shell === shell ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const result = switchShell(shell)
                      if (result.newState) {
                        setGameState((prev) => ({ ...prev, ...result.newState }))
                      }
                    }}
                    className={
                      gameState.shell === shell
                        ? gameState.darkMode
                          ? "bg-green-600 hover:bg-green-700 text-black"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                        : gameState.darkMode
                          ? "border-green-500 text-green-400 hover:bg-green-900/20"
                          : "border-gray-400 text-gray-700 hover:bg-gray-100"
                    }
                  >
                    {shell.toUpperCase()}
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          {/* Game Modes */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Button
              onClick={() => {
                const result = startTutorialMode()
                addToHistory(result.output)
              }}
              className={`h-32 flex flex-col items-center gap-3 ${
                gameState.darkMode
                  ? "bg-blue-900/50 hover:bg-blue-800/50 border border-blue-500/50 text-cyan-400"
                  : "bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-900"
              }`}
            >
              <BookOpen className="w-10 h-10" />
              <div className="text-center">
                <div className="font-bold text-lg">Tutorial Mode</div>
                <div className="text-sm opacity-80">Learn essential commands</div>
                <div className="text-xs mt-1">Shell-specific training</div>
              </div>
            </Button>

            <Button
              onClick={() => {
                const result = startQuestMode()
                addToHistory(result.output)
              }}
              className={`h-32 flex flex-col items-center gap-3 ${
                gameState.darkMode
                  ? "bg-purple-900/50 hover:bg-purple-800/50 border border-purple-500/50 text-purple-300"
                  : "bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900"
              }`}
            >
              <Sword className="w-10 h-10" />
              <div className="text-center">
                <div className="font-bold text-lg">Quest Mode</div>
                <div className="text-sm opacity-80">Story-driven missions</div>
                <div className="text-xs mt-1">Advanced spy scenarios</div>
              </div>
            </Button>

            <Button
              onClick={() => {
                const result = startArenaMode()
                addToHistory(result.output)
              }}
              className={`h-32 flex flex-col items-center gap-3 ${
                gameState.darkMode
                  ? "bg-red-900/50 hover:bg-red-800/50 border border-red-500/50 text-red-300"
                  : "bg-red-100 hover:bg-red-200 border border-red-300 text-red-900"
              }`}
            >
              <Target className="w-10 h-10" />
              <div className="text-center">
                <div className="font-bold text-lg">Challenge Arena</div>
                <div className="text-sm opacity-80">Competitive challenges</div>
                <div className="text-xs mt-1">Coming soon</div>
              </div>
            </Button>
          </div>

          {/* Quick Start */}
          <div className="text-center">
            <Button
              onClick={() => setGameState((prev) => ({ ...prev, mode: "terminal" }))}
              className={`text-lg px-8 py-3 ${
                gameState.darkMode
                  ? "bg-green-700 hover:bg-green-600 text-black"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              Enter Terminal <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <p className={`text-sm mt-2 ${gameState.darkMode ? "text-green-500" : "text-gray-500"}`}>
              Jump straight into the enhanced terminal environment
            </p>
          </div>
        </div>
      </div>
    )
  }

  const terminalWidth = showGamePane ? `${100 - gamePaneWidth}%` : "100%"
  const gamePaneWidthStyle = showGamePane ? `${gamePaneWidth}%` : "0%"

  return (
    <div className={`min-h-screen ${themeClasses} p-4 font-mono transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          className={`flex items-center justify-between mb-4 pb-3 border-b ${gameState.darkMode ? "border-green-500/30" : "border-gray-300"}`}
        >
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setGameState((prev) => ({ ...prev, mode: "menu" }))}
              variant="outline"
              size="sm"
              className={
                gameState.darkMode
                  ? "border-green-500 text-green-400 hover:bg-green-900/20"
                  : "border-gray-400 text-gray-700 hover:bg-gray-100"
              }
            >
              ← Menu
            </Button>
            <div className="flex items-center gap-2">
              <Terminal className="w-6 h-6" />
              <span className={`font-bold text-lg ${brightTextClass}`}>Terminal Academy v3.0</span>
            </div>
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              className={
                gameState.darkMode ? "text-green-400 hover:bg-green-900/20" : "text-gray-700 hover:bg-gray-100"
              }
            >
              {gameState.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className={brightTextClass}>Level {gameState.level}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={accentTextClass}>XP: {gameState.xp.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span>{gameState.currentDrive}</span>
            </div>
            <Badge
              variant="outline"
              className={gameState.darkMode ? "border-green-500 text-green-400" : "border-gray-400"}
            >
              {gameState.shell.toUpperCase()}
            </Badge>
            {(gameState.mode === "tutorial" || gameState.mode === "quest" || gameState.mode === "arena") && (
              <Button
                onClick={() => setShowGamePane(!showGamePane)}
                variant="ghost"
                size="sm"
                className={
                  gameState.darkMode ? "text-green-400 hover:bg-green-900/20" : "text-gray-700 hover:bg-gray-100"
                }
              >
                {showGamePane ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div ref={containerRef} className="flex gap-4 h-[calc(100vh-200px)] relative">
          {/* Terminal */}
          <div style={{ width: terminalWidth }} className="transition-all duration-300">
            <Card className={`${terminalClasses} h-full flex flex-col`}>
              <div ref={terminalRef} className="flex-1 p-4 overflow-y-auto space-y-1 font-mono text-sm">
                {terminalHistory.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap leading-relaxed">
                    {line}
                  </div>
                ))}

                {/* Current input line */}
                <div className="flex items-start">
                  <span className={`${gameState.darkMode ? "text-green-300" : "text-blue-600"} whitespace-nowrap`}>
                    {getPrompt()}
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className={`flex-1 bg-transparent border-none outline-none ${
                      gameState.darkMode ? "text-green-400" : "text-gray-900"
                    }`}
                    placeholder="Enter command..."
                    autoFocus
                  />
                </div>
              </div>

              {/* Footer */}
              <div className={`border-t ${gameState.darkMode ? "border-green-500/30" : "border-gray-300"} p-3 text-xs`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span>Type 'help' for commands • 'exit' to return to menu</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={brightTextClass}>
                      ↑↓ History • Tab Complete • {gameState.shell.toUpperCase()} mode
                    </span>
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      <span className={accentTextClass}>
                        {(gameState.drives[gameState.currentDrive].freeSpace / 1024 ** 3).toFixed(1)}GB free
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Resize Handle */}
          {showGamePane && (
            <div
              className={`w-1 cursor-col-resize flex items-center justify-center ${
                gameState.darkMode ? "bg-green-500/30 hover:bg-green-500/50" : "bg-gray-300 hover:bg-gray-400"
              } transition-colors ${isResizing ? "bg-green-500" : ""}`}
              onMouseDown={handleMouseDown}
            >
              <GripVertical className="w-3 h-3 opacity-50" />
            </div>
          )}

          {/* Game Pane */}
          {showGamePane && (
            <div style={{ width: gamePaneWidthStyle }} className="transition-all duration-300">
              <GamePane />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function createInitialGameState(): GameState {
  const drives: { [key: string]: Drive } = {
    C: {
      letter: "C",
      label: "System",
      type: "local",
      totalSpace: 500 * 1024 ** 3, // 500GB
      freeSpace: 250 * 1024 ** 3, // 250GB free
      fileSystem: "NTFS",
      root: createWindowsFileSystem(),
    },
    D: {
      letter: "D",
      label: "Data",
      type: "local",
      totalSpace: 1000 * 1024 ** 3, // 1TB
      freeSpace: 750 * 1024 ** 3, // 750GB free
      fileSystem: "NTFS",
      root: createDataFileSystem(),
    },
  }

  const processes: Process[] = [
    { pid: 1234, name: "terminal-academy", cpu: 2.3, memory: 15.2, user: "agent" },
    { pid: 5678, name: "system", cpu: 0.1, memory: 2.1, user: "root" },
    { pid: 9012, name: "bash", cpu: 0.0, memory: 1.5, user: "agent" },
    { pid: 3456, name: "sshd", cpu: 0.0, memory: 0.8, user: "root" },
    { pid: 7890, name: "networkd", cpu: 0.2, memory: 3.2, user: "root" },
  ]

  return {
    currentDirectory: "/home/agent",
    currentDrive: "C",
    drives,
    shell: "bash",
    mode: "menu",
    level: 1,
    xp: 0,
    commandHistory: [],
    historyIndex: 0,
    processes,
    environment: {
      USER: "agent",
      HOSTNAME: "terminal-academy",
      SHELL: "/bin/bash",
      HOME: "/home/agent",
      PATH: "/usr/local/bin:/usr/bin:/bin",
      PWD: "/home/agent",
      TERM: "xterm-256color",
      LANG: "en_US.UTF-8",
      DISPLAY: ":0",
    },
    darkMode: true,
  }
}

function createWindowsFileSystem(): FileSystemNode {
  const now = new Date()

  return {
    name: "/",
    type: "directory",
    size: 4096,
    permissions: "drwxr-xr-x",
    owner: "root",
    group: "root",
    created: now,
    modified: now,
    accessed: now,
    children: {
      home: {
        name: "home",
        type: "directory",
        size: 4096,
        permissions: "drwxr-xr-x",
        owner: "root",
        group: "root",
        created: now,
        modified: now,
        accessed: now,
        children: {
          agent: {
            name: "agent",
            type: "directory",
            size: 4096,
            permissions: "drwxr-xr-x",
            owner: "agent",
            group: "users",
            created: now,
            modified: now,
            accessed: now,
            children: {
              Documents: {
                name: "Documents",
                type: "directory",
                size: 4096,
                permissions: "drwxr-xr-x",
                owner: "agent",
                group: "users",
                created: now,
                modified: now,
                accessed: now,
                children: {
                  "mission_brief.txt": {
                    name: "mission_brief.txt",
                    type: "file",
                    size: 1024,
                    permissions: "-rw-r--r--",
                    owner: "agent",
                    group: "users",
                    created: now,
                    modified: now,
                    accessed: now,
                    content:
                      "CLASSIFIED: Operation Terminal Academy\nAgent training protocols and mission objectives.\nAdvanced command-line operations required.",
                    mimeType: "text/plain",
                  },
                },
              },
              mission_data: {
                name: "mission_data",
                type: "directory",
                size: 4096,
                permissions: "drwx------",
                owner: "agent",
                group: "users",
                created: now,
                modified: now,
                accessed: now,
                children: {
                  classified: {
                    name: "classified",
                    type: "directory",
                    size: 4096,
                    permissions: "drwx------",
                    owner: "agent",
                    group: "users",
                    created: now,
                    modified: now,
                    accessed: now,
                    children: {
                      "backup.dat": {
                        name: "backup.dat",
                        type: "file",
                        size: 8192,
                        permissions: "-rw-------",
                        owner: "agent",
                        group: "users",
                        created: now,
                        modified: now,
                        accessed: now,
                        content:
                          "ENCRYPTED_BACKUP_DATA_V3.1\nCritical system files and configuration data.\nDecryption key required for access.",
                        mimeType: "application/octet-stream",
                      },
                      "recovery.key": {
                        name: "recovery.key",
                        type: "file",
                        size: 512,
                        permissions: "-rw-------",
                        owner: "agent",
                        group: "users",
                        created: now,
                        modified: now,
                        accessed: now,
                        content:
                          "-----BEGIN RECOVERY KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VH2K9mF3n8Qx\n-----END RECOVERY KEY-----",
                        mimeType: "application/x-pem-file",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }
}

function createDataFileSystem(): FileSystemNode {
  const now = new Date()

  return {
    name: "/",
    type: "directory",
    size: 4096,
    permissions: "drwxr-xr-x",
    owner: "root",
    group: "root",
    created: now,
    modified: now,
    accessed: now,
    children: {},
  }
}
