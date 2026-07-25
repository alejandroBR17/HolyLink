import sys
with open('src/App.tsx', 'r') as f:
    content = f.read()

start_marker = "            {activeMobileTab === 'monitor' && ("
end_marker = "                        <div className=\"text-xs text-zinc-500 leading-relaxed mt-4 border-t border-zinc-900 pt-4\">"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

replacement = """            {activeMobileTab === 'monitor' && (
              <MonitorPanel
                projectionWin={projectionWin}
                setProjectionWin={setProjectionWin}
                currentTime={currentTime}
                isLooping={isLooping}
                isFinalFiveMinutes={isFinalFiveMinutes}
                isFinalMinute={isFinalMinute}
                isJustStarted={isJustStarted}
                activeAlert={activeAlert}
                blackoutEnabled={blackoutEnabled}
                clearContentEnabled={clearContentEnabled}
                currentSlideId={currentSlideId}
                hoursStr={hoursStr}
                minutesStr={minutesStr}
                diffSeconds={diffSeconds}
                formatMinutesPart={formatMinutesPart}
                formatSecondsPart={formatSecondsPart}
                customVerseText={customVerseText}
                customVerseRef={customVerseRef}
                activeVerseIndex={activeVerseIndex}
                customMediaList={customMediaList}
                videoPinBehavior={videoPinBehavior}
                loopIteration={loopIteration}
                updateStateAndBroadcast={updateStateAndBroadcast}
                customMeetings={customMeetings}
                customCampaigns={customCampaigns}
                nextMeeting={nextMeeting}
                nextMeetingDate={nextMeetingDate}
                ongoingMeeting={ongoingMeeting}
                volume={volume}
                tickerText={tickerText}
                syncStatus={syncStatus}
                isProjectionOpen={isProjectionOpen}
              />
            )}
          </main>

          {/* DESKTOP RIGHT PREVIEW MONITOR SIDEBAR */}
          <aside className="hidden lg:flex w-[320px] xl:w-[360px] border-l border-zinc-900 bg-zinc-950/40 p-6 flex-col gap-6 overflow-y-auto shrink-0 text-left">
            <MonitorPanel
              projectionWin={projectionWin}
              setProjectionWin={setProjectionWin}
              currentTime={currentTime}
              isLooping={isLooping}
              isFinalFiveMinutes={isFinalFiveMinutes}
              isFinalMinute={isFinalMinute}
              isJustStarted={isJustStarted}
              activeAlert={activeAlert}
              blackoutEnabled={blackoutEnabled}
              clearContentEnabled={clearContentEnabled}
              currentSlideId={currentSlideId}
              hoursStr={hoursStr}
              minutesStr={minutesStr}
              diffSeconds={diffSeconds}
              formatMinutesPart={formatMinutesPart}
              formatSecondsPart={formatSecondsPart}
              customVerseText={customVerseText}
              customVerseRef={customVerseRef}
              activeVerseIndex={activeVerseIndex}
              customMediaList={customMediaList}
              videoPinBehavior={videoPinBehavior}
              loopIteration={loopIteration}
              updateStateAndBroadcast={updateStateAndBroadcast}
              customMeetings={customMeetings}
              customCampaigns={customCampaigns}
              nextMeeting={nextMeeting}
              nextMeetingDate={nextMeetingDate}
              ongoingMeeting={ongoingMeeting}
              volume={volume}
              tickerText={tickerText}
              syncStatus={syncStatus}
              isProjectionOpen={isProjectionOpen}
            />

"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.write(new_content)
