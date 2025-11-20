namespace Ireadervalar.Packaging;

using System.IO.Abstractions;
using Ireadervalar.Serialization;

// TODO - rename this to EntityFileStore (and Tandoku.Storage folder/namespace)
// (and maybe later introduce IEntityStore abstraction over underlying store - requires abstraction for store location, relative paths)
internal sealed class Packager<TVersion>
    where TVersion : class, IPackageVersion<TVersion>
{
    private const string VersionFileName = "version";

    private readonly string packageTypeName;
    private readonly string metadataDirectoryName;
    private readonly string legacyMetadataDirectoryName;

    internal Packager(string packageTypeName)
    {
        this.packageTypeName = packageTypeName;
        this.metadataDirectoryName = ".ireadervalar-" + packageTypeName;
        this.legacyMetadataDirectoryName = ".tandoku-" + packageTypeName;
    }

    internal async Task InitializePackageAsync(IDirectoryInfo directory, TVersion version, bool force)
    {
        if (directory.Exists)
        {
            if (!force && directory.EnumerateFileSystemInfos().Any())
                throw new ArgumentException("The specified directory is not empty and force is not specified.");
        }
        else
        {
            // Note: this can throw IOException if a conflicting file exists at the path
            directory.Create();
        }

        var metadataDirectory = directory.GetSubdirectory(this.metadataDirectoryName);
        var legacyMetadataDirectory = directory.GetSubdirectory(this.legacyMetadataDirectoryName);
        if (metadataDirectory.Exists || legacyMetadataDirectory.Exists)
        {
            throw new InvalidOperationException($"A ireadervalar {this.packageTypeName} already exists in the specified directory.");
        }
        else
        {
            metadataDirectory.Create();
        }

        var versionFile = metadataDirectory.GetFile(VersionFileName);
        await version.WriteToAsync(versionFile);
    }

    internal IEnumerable<IDirectoryInfo> GetPackageDirectories(IDirectoryInfo baseDirectory)
    {
        if (baseDirectory.Exists)
        {
            var newDirs = baseDirectory
                .EnumerateDirectories(this.metadataDirectoryName, SearchOption.AllDirectories)
                .Select(d => d.Parent)
                .OfType<IDirectoryInfo>();
            var legacyDirs = baseDirectory
                .EnumerateDirectories(this.legacyMetadataDirectoryName, SearchOption.AllDirectories)
                .Select(d => d.Parent)
                .OfType<IDirectoryInfo>();
            return newDirs.Concat(legacyDirs);
        }
        return Enumerable.Empty<IDirectoryInfo>();
    }

    internal async Task<TVersion> GetPackageMetadataAsync(IDirectoryInfo directory)
    {
        var metadataDirectory = directory.GetSubdirectory(this.metadataDirectoryName);
        var versionFile = metadataDirectory.GetFile(VersionFileName);
        TVersion? version = null;
        if (versionFile.Exists)
        {
            version = await IPackageVersion<TVersion>.ReadFromAsync(versionFile);
        }
        else
        {
            var legacyMetadataDirectory = directory.GetSubdirectory(this.legacyMetadataDirectoryName);
            var legacyVersionFile = legacyMetadataDirectory.GetFile(VersionFileName);
            version = legacyVersionFile.Exists ?
                await IPackageVersion<TVersion>.ReadFromAsync(legacyVersionFile) :
                null;
        }
        if (version is null)
            throw new ArgumentException($"The specified directory is not a valid ireadervalar {this.packageTypeName}.");

        return version;
    }

    internal string? ResolvePackageDirectoryPath(IDirectoryInfo directory, bool checkAncestors = false)
    {
        if (directory.Exists)
        {
            var metadataDirectory = directory.GetSubdirectory(this.metadataDirectoryName);
            var legacyMetadataDirectory = directory.GetSubdirectory(this.legacyMetadataDirectoryName);
            if (metadataDirectory.Exists || legacyMetadataDirectory.Exists)
                return directory.FullName;

            return checkAncestors && directory.Parent is not null ?
                this.ResolvePackageDirectoryPath(directory.Parent, checkAncestors) :
                null;
        }
        else if (directory.FileSystem.File.Exists(directory.FullName))
        {
            throw new ArgumentOutOfRangeException(nameof(directory), "The specified path refers to a file where a directory is expected.");
        }
        else
        {
            throw new ArgumentException("The specified path does not exist.");
        }
    }

    internal async Task<(IFileInfo PartFile, TPart PartContents)> ReadPackagePart<TPart>(
        IDirectoryInfo packageDirectory,
        string relativePath,
        string partName)
        where TPart : IYamlSerializable<TPart>
    {
        var file = packageDirectory.GetFile(relativePath);
        var contents = file.Exists ?
            await TPart.ReadYamlAsync(file) :
            throw new ArgumentException($"The specified directory does not contain a ireadervalar {this.packageTypeName} {partName}.");
        return (file, contents);
    }

    internal async Task<IFileInfo> WritePackagePart<TPart>(
        IDirectoryInfo packageDirectory,
        string relativePath,
        TPart partContents)
        where TPart : IYamlSerializable<TPart>
    {
        var file = packageDirectory.GetFile(relativePath);
        await partContents.WriteYamlAsync(file);
        return file;
    }
}
