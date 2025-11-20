namespace Tandoku.CommandLine.Tests;

using Ireadervalar.Library;

public class LibraryCommandTests : CliTestBase
{
    [Fact]
    public Task Init() => this.RunAndAssertAsync(
        "library init",
        $"Initialized new ireadervalar library at {this.baseDirectory.FullName}");

    [Fact]
    public Task InitWithPath() => this.RunAndAssertAsync(
        "library init ireadervalar-library",
        $"Initialized new ireadervalar library at {this.ToFullPath("ireadervalar-library")}");

    [Fact]
    public Task InitWithFullPath() => this.RunAndAssertAsync(
        $"library init {this.ToFullPath("ireadervalar-library")}",
        $"Initialized new ireadervalar library at {this.ToFullPath("ireadervalar-library")}");

    [Fact]
    public async Task InitWithNonEmptyDirectory()
    {
        this.fileSystem.AddEmptyFile(this.ToFullPath("ireadervalar-library", "existing.txt"));
        await this.RunAndAssertAsync(
            "library init ireadervalar-library",
            expectedOutput: string.Empty,
            expectedError: "The specified directory is not empty and force is not specified.");
    }

    [Fact]
    public async Task InitWithNonEmptyDirectoryForce()
    {
        this.fileSystem.AddEmptyFile(this.ToFullPath("ireadervalar-library", "existing.txt"));
        await this.RunAndAssertAsync(
            "library init ireadervalar-library --force",
            $"Initialized new ireadervalar library at {this.ToFullPath("ireadervalar-library")}");
    }

    [Fact]
    public async Task Info()
    {
        var info = await this.SetupLibrary();
        this.fileSystem.Directory.SetCurrentDirectory(info.Path);

        await this.RunAndAssertAsync(
            $"library info",
            GetExpectedInfoOutput(info));
    }

    [Fact]
    public async Task InfoInNestedPath()
    {
        var info = await this.SetupLibrary();
        var libraryDirectory = this.fileSystem.GetDirectory(info.Path);
        var nestedDirectory = libraryDirectory.CreateSubdirectory("nested-directory");
        this.fileSystem.Directory.SetCurrentDirectory(nestedDirectory.FullName);

        await this.RunAndAssertAsync(
            $"library info",
            GetExpectedInfoOutput(info));
    }

    [Fact]
    public async Task InfoInOtherPath()
    {
        await this.SetupLibrary();
        var otherDirectory = this.baseDirectory.CreateSubdirectory("other-directory");
        this.fileSystem.Directory.SetCurrentDirectory(otherDirectory.FullName);

        await this.RunAndAssertAsync(
            $"library info",
            expectedError: "The specified path does not contain a ireadervalar library.");
    }

    [Fact]
    public async Task InfoInOtherPathWithEnvironment()
    {
        var info = await this.SetupLibrary();
        var otherDirectory = this.baseDirectory.CreateSubdirectory("other-directory");
        this.fileSystem.Directory.SetCurrentDirectory(otherDirectory.FullName);
        this.environment.SetEnvironmentVariable(KnownEnvironmentVariables.TandokuLibrary, info.Path);

        await this.RunAndAssertAsync(
            $"library info",
            GetExpectedInfoOutput(info));
    }

    [Fact]
    public async Task InfoWithLibraryPath()
    {
        var info = await this.SetupLibrary();

        await this.RunAndAssertAsync(
            $"library info --library {info.Path}",
            GetExpectedInfoOutput(info));
    }

    [Fact]
    public async Task InfoWithDefinitionPath()
    {
        var info = await this.SetupLibrary();

        await this.RunAndAssertAsync(
            $"library info --library {info.DefinitionPath}",
            expectedError: "The specified path refers to a file where a directory is expected. (Parameter 'directory')");
    }

    [Fact]
    public async Task InfoInvalidPath()
    {
        await this.SetupLibrary();

        await this.RunAndAssertAsync(
            $"library info --library does-not-exist",
            expectedError: "The specified path does not exist.");
    }

    private Task<LibraryInfo> SetupLibrary()
    {
        var libraryManager = new LibraryManager(this.fileSystem);
        var libraryRootPath = this.ToFullPath("ireadervalar-library");
        return libraryManager.InitializeAsync(libraryRootPath);
    }

    private static string GetExpectedInfoOutput(LibraryInfo info) =>
@$"Path: {info.Path}
Version: {info.Version.Version}
Definition path: {info.DefinitionPath}
Language: {info.Definition.Language}";
//Reference language: {info.Definition.ReferenceLanguage}";
}