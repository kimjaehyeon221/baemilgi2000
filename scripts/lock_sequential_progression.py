from pathlib import Path

app_path = Path('App.tsx')
core_path = Path('src/core.ts')
design_path = Path('DESIGN.md')
qa_path = Path('RELEASE_QA.md')

app = app_path.read_text()

app = app.replace(
    """            selectedLevel: success
              ? Math.min(200, Math.max(clearedLevel + 1, state.selectedLevel))
              : state.selectedLevel,""",
    """            selectedLevel: success
              ? Math.min(200, clearedLevel + 1)
              : Math.min(200, old + 1),""",
)
app = app.replace(
    "  const nextLevel = state.clearedLevel >= 200 ? 200 : Math.max(state.clearedLevel + 1, state.selectedLevel);",
    "  const nextLevel = state.clearedLevel >= 200 ? 200 : state.clearedLevel + 1;",
)

old_grid = """                  onPress={async () => {
                    if (done) setTrainingLevel(level);
                    else {
                      await commit({ ...state, selectedLevel: level });
                      setTab('home');
                    }
                  }}
                  style={[styles.cell, done && styles.cellDone, selected && styles.cellSelected]}"""
new_grid = """                  onPress={() => {
                    if (done) {
                      setTrainingLevel(level);
                      return;
                    }
                    if (level === nextLevel) {
                      setTab('home');
                      return;
                    }
                    Alert.alert(
                      `레벨 ${level} · ${reps}개`,
                      `앞으로 만날 퀘스트야. 현재는 레벨 ${nextLevel}부터 이어서 진행해.`,
                    );
                  }}
                  accessibilityHint={done ? '완료한 단계의 훈련을 시작합니다' : level === nextLevel ? '현재 다음 퀘스트로 이동합니다' : '미래 퀘스트의 목표를 미리 봅니다'}
                  style={[styles.cell, done && styles.cellDone, selected && styles.cellSelected]}"""
if old_grid not in app:
    raise SystemExit('quest grid interaction block not found')
app = app.replace(old_grid, new_grid)

old_milestone = """                  onPress={async () => {
                    if (done) setTrainingLevel(level);
                    else {
                      await commit({ ...state, selectedLevel: level });
                      setTab('home');
                    }
                  }}
                  style={styles.milestoneRow}"""
new_milestone = """                  onPress={() => {
                    if (done) {
                      setTrainingLevel(level);
                      return;
                    }
                    Alert.alert(
                      `관문 · 레벨 ${level}`,
                      `${reps.toLocaleString()}개. 현재 퀘스트를 이어가면 이 관문에 도달해.`,
                    );
                  }}
                  accessibilityHint={done ? '완료한 관문 단계의 훈련을 시작합니다' : '미래 관문의 목표를 미리 봅니다'}
                  style={styles.milestoneRow}"""
if old_milestone not in app:
    raise SystemExit('milestone interaction block not found')
app = app.replace(old_milestone, new_milestone)

# Future milestones are previews, so the arrow must not imply navigation into a skipped challenge.
app = app.replace(
    """                  <Text style={styles.linkArrow}>→</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {tab === 'records'""",
    """                  <Text style={styles.linkArrow}>{done ? '↻' : '·'}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {tab === 'records'""",
)
app_path.write_text(app)

core = core_path.read_text()
old_recompute = """  const minimumSelected = clearedLevel >= 200 ? 200 : clearedLevel + 1;
  return {
    ...raw,
    clearedLevel,
    selectedLevel: Math.max(minimumSelected, Math.min(200, raw.selectedLevel || minimumSelected)),
  };"""
new_recompute = """  const minimumSelected = clearedLevel >= 200 ? 200 : clearedLevel + 1;
  return {
    ...raw,
    clearedLevel,
    // kept in the persisted schema for backwards compatibility; release progression is sequential.
    selectedLevel: minimumSelected,
  };"""
if old_recompute not in core:
    raise SystemExit('recomputeProgress block not found')
core = core.replace(old_recompute, new_recompute)
core_path.write_text(core)

design = design_path.read_text()
if '### Sequential progression lock' not in design:
    design += """

### Sequential progression lock

The release build uses sequential quests. The user's baseline/current max determines the starting point, and after that the only active challenge is `clearedLevel + 1` (or 200 after completion). Future quest cells and milestone rows are previews, not shortcuts. Completed levels may be reopened as training.

Why: the product promise is a durable training path, not a level picker. Skilled users already skip irrelevant early stages through the onboarding baseline, so arbitrary future-jump controls add inconsistency without meaningful utility.
"""
design_path.write_text(design)

qa = qa_path.read_text()
if '- [ ] Future quest/milestone taps cannot skip progression.' not in qa:
    qa = qa.replace(
        '## P0 — Block release if any fail\n',
        '## P0 — Block release if any fail\n\n- [ ] Future quest/milestone taps cannot skip progression.\n- [ ] Baseline-derived starting level still skips irrelevant early quests correctly.\n',
    )
qa_path.write_text(qa)

print('Locked BAEMILGI to sequential release progression.')
