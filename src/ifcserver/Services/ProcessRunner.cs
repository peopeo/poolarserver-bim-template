using System.Diagnostics;

namespace ifcserver.Services
{
    public static class ProcessRunner
    {
        /// <summary>
        /// Runs a command-line process asynchronously and returns its combined output.
        /// </summary>
        public static async Task<string> RunProcessAsync(string command, string arguments)
        {
            var processStartInfo = new ProcessStartInfo
            {
                FileName = command,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process
            {
                StartInfo = processStartInfo
            };

            process.Start();

            string output = await process.StandardOutput.ReadToEndAsync();
            string error = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception($"Process failed with exit code {process.ExitCode}: {error}");
            }

            return output;
        }
    }
}
