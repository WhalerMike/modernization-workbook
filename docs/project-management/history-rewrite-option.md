# Option: rewrite history to drop the old decks and narration audio

**Status: an option for the maintainer to decide. Nothing here has been done.**

The generated decks (`.pptx`) and narration audio (`.mp3`) now leave git and are published as edition Release assets (see "Editions and the archive" in [CONTRIBUTING.md](../../CONTRIBUTING.md)). That stops the repository growing with every rebuild, but it doesn't shrink it: every version ever committed stays in git's history, and every clone downloads it.

## What the history holds

Measured on October 31, 2026, over every object reachable from any ref:

| Files | Versions in history | Size uncompressed | Size in the packfile |
|---|---:|---:|---:|
| `.pptx` decks | 419 | 2.0 GiB | 1.41 GiB |
| `.mp3` narration | 2,713 | 0.89 GiB | 0.84 GiB |
| `.docx` (old committed Word files) | 35 | 49 MiB | 49 MiB |
| `.mp4` (Start Here, still tracked) | 1 | 36 MiB | 27 MiB |
| Everything else | | | about 0.1 GiB |
| **Whole repository** | | | **2.43 GiB** |

GitHub's guidance on repository limits asks that repositories stay small, and warns as they approach 10 GB; release assets don't count toward a repository's size.

## What a rewrite would reclaim

Removing every `.pptx` and `.mp3` path from all of history (with [`git filter-repo`](https://github.com/newren/git-filter-repo), for example `git filter-repo --path-glob '*.pptx' --path-glob '*.mp3' --invert-paths`), plus the old `.docx` copies, would take the packfile from about **2.43 GiB to about 0.15 to 0.2 GiB**. A fresh clone would go from minutes to seconds. The Start Here MP4 can stay or go the same way.

## What it would cost

A history rewrite changes the ID of every commit from the first one that touched a removed file, which here is nearly all of them. So:

- **Every clone and worktree has to be replaced.** Pulling into an old clone would bring the old history back. Each clone, including the maintainer's main checkout and every agent worktree under `.claude/worktrees/`, has to be deleted and cloned again after the rewrite, with any uncommitted work copied out first.
- **Every open pull request has to be redone.** A pull request's branch is built on the old commits. Each one has to be closed, its changes reapplied on the rewritten `main` (cherry-pick or re-create), and opened again. Its review comments stay on the closed one.
- **Tags have to be rewritten and force-pushed.** The kit and video releases (`helpdesk-entra-kit-v1.6*`, `videos-2026-10-2*`, `hr-identity-interview-2026-10-20`) and any edition tags would point at new commits. Their release assets don't change. The `commit:` field of each edition in `data/editions.yml` would need updating.
- **Links to commits break.** Any link to a commit ID (`…/commit/<id>`, `…/blob/<id>/…`) stops resolving. Links to `main`, to tags and to release downloads keep working once the tags are pushed again.
- **GitHub keeps the old objects until its support team removes them.** Old pull requests keep references (`refs/pull/*`) to the old commits, and GitHub caches views. The space is only freed after GitHub Support garbage-collects the repository on request; GitHub's guide to removing data from a repository describes the steps.
- **Forks keep the old history.** A rewrite can't change someone else's fork.
- **Branch protection and force-push.** `main` has to accept one force-push for the rewrite.

## If the maintainer decides to do it

The cheapest moment is right after the pull request that moves the decks and audio to Releases merges and **before the first edition is cut**, so no edition tag needs rewriting, and when no other pull request is open.

1. Announce a freeze; merge or close every open pull request; let running agent sessions finish and commit.
2. Mirror-clone the repository and keep that clone untouched as a backup.
3. In a second fresh clone, run `git filter-repo` with the paths above, check that `main` builds, and compare `git ls-files` with the old `main`: only the removed files should differ.
4. Force-push `main` and the tags. Recreate any closed pull requests that are still wanted.
5. Ask GitHub Support to remove the cached views and old pull request references and run garbage collection.
6. Delete and re-clone every local checkout and worktree.

## Doing nothing instead

Without a rewrite, the repository stays at about 2.4 GiB and grows only with text from now on. Local clones can avoid downloading the old binaries with a partial clone, `git clone --filter=blob:none`, which fetches file contents only when a checkout needs them; the deploy and check workflows already check out that way. Git LFS isn't recommended here: its storage and bandwidth count against account quotas, and it would still need a rewrite to move the old files.
